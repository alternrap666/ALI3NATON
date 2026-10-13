package com.alternrap.bloodrush

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.SoundPool
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import java.io.ByteArrayOutputStream
import java.io.File
import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.tanh
import kotlin.random.Random

/** All audio is synthesized at first launch: no asset files needed. */
class Audio(private val ctx: Context) {
    private val rate = 22050
    private val rnd = Random(1337)
    private val pool: SoundPool = SoundPool.Builder()
        .setMaxStreams(10)
        .setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
        ).build()
    private val ids = java.util.concurrent.ConcurrentHashMap<String, Int>()
    private var music: MediaPlayer? = null
    @Volatile private var musicFile: File? = null
    @Volatile private var wantMusic = false
    private val lock = Any()

    @Suppress("DEPRECATION")
    private val vib: Vibrator? = ctx.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator

    init {
        Thread { build() }.also { it.isDaemon = true }.start()
    }

    // ------------------------------------------------------------ public API

    fun play(name: String, volume: Float = 1f) {
        val id = ids[name] ?: return
        pool.play(id, volume, volume, 1, 0, 1f)
    }

    fun vibrate(ms: Long, amp: Int = 255) {
        val v = vib ?: return
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                v.vibrate(VibrationEffect.createOneShot(ms, amp.coerceIn(1, 255)))
            } else {
                @Suppress("DEPRECATION") v.vibrate(ms)
            }
        } catch (_: Exception) {}
    }

    fun startMusic() {
        wantMusic = true
        synchronized(lock) {
            val f = musicFile ?: return
            if (music == null) {
                music = try {
                    MediaPlayer().apply {
                        setDataSource(f.absolutePath)
                        isLooping = true
                        setVolume(0.55f, 0.55f)
                        prepare()
                    }
                } catch (e: Exception) { null }
            }
            try { music?.start() } catch (_: Exception) {}
        }
    }

    fun pauseMusic() {
        wantMusic = false
        synchronized(lock) { try { music?.pause() } catch (_: Exception) {} }
    }

    fun release() {
        wantMusic = false
        synchronized(lock) {
            try { music?.release() } catch (_: Exception) {}
            music = null
        }
        pool.release()
    }

    // ------------------------------------------------------------ synthesis

    private fun build() {
        val dir = File(ctx.cacheDir, "sfx").apply { mkdirs() }
        fun reg(name: String, data: FloatArray) {
            val f = File(dir, "$name.wav")
            f.writeBytes(wav(data))
            ids[name] = pool.load(f.absolutePath, 1)
        }
        reg("shot", shot(0.12f, 200f, 38f, 0.55f))
        reg("shotgun", shot(0.35f, 110f, 12f, 1f))
        reg("hit", hit())
        reg("gib", gib())
        reg("hurt", hurt())
        reg("pickup", pickup())
        reg("wave", wave())
        reg("nuke", nuke())
        reg("death", death())

        val mf = File(dir, "music.wav")
        mf.writeBytes(wav(musicLoop()))
        musicFile = mf
        if (wantMusic) startMusic()
    }

    private fun noise() = rnd.nextFloat() * 2f - 1f

    private fun shot(len: Float, f0: Float, decay: Float, amp: Float): FloatArray {
        val n = (len * rate).toInt()
        var ph = 0f
        return FloatArray(n) { i ->
            val t = i / rate.toFloat()
            ph += (f0 * exp(-t * 18f) + 40f) / rate
            val body = sin(2 * PI.toFloat() * ph) * exp(-t * decay * 0.7f)
            val crack = noise() * exp(-t * decay)
            (body * 0.6f + crack * 0.8f) * amp
        }
    }

    private fun hit(): FloatArray {
        val n = (0.09f * rate).toInt()
        var lp = 0f
        return FloatArray(n) { i ->
            val t = i / rate.toFloat()
            lp += (noise() - lp) * 0.35f
            (lp * 1.2f + sin(2 * PI.toFloat() * 90f * t) * 0.5f) * exp(-t * 40f)
        }
    }

    /** Wet crunchy splatter. */
    private fun gib(): FloatArray {
        val n = (0.55f * rate).toInt()
        var lp = 0f
        var ph = 0f
        return FloatArray(n) { i ->
            val t = i / rate.toFloat()
            lp += (noise() - lp) * (0.12f + 0.2f * exp(-t * 8f))
            ph += (140f * exp(-t * 6f) + 35f) / rate
            val thump = sin(2 * PI.toFloat() * ph) * exp(-t * 9f)
            // bubbling squelches
            val bub = if (sin(t * 70f + sin(t * 23f) * 4f) > 0.6f) lp * 0.9f else 0f
            tanh((lp * 1.6f + thump * 1.2f + bub) * exp(-t * 5f) * 1.8f)
        }
    }

    private fun hurt(): FloatArray {
        val n = (0.3f * rate).toInt()
        var ph = 0f
        return FloatArray(n) { i ->
            val t = i / rate.toFloat()
            ph += (160f - 110f * t / 0.3f) / rate
            tanh(sin(2 * PI.toFloat() * ph) * 3f) * exp(-t * 9f) * 0.8f + noise() * exp(-t * 30f) * 0.5f
        }
    }

    private fun pickup(): FloatArray {
        val n = (0.3f * rate).toInt()
        return FloatArray(n) { i ->
            val t = i / rate.toFloat()
            val f = if (t < 0.1f) 520f else if (t < 0.2f) 700f else 940f
            sin(2 * PI.toFloat() * f * t) * exp(-(t % 0.1f) * 12f) * 0.6f
        }
    }

    private fun wave(): FloatArray {
        val n = (0.9f * rate).toInt()
        var ph = 0f
        return FloatArray(n) { i ->
            val t = i / rate.toFloat()
            ph += (70f + 40f * sin(t * 9f)) / rate
            tanh(sin(2 * PI.toFloat() * ph) * 4f) * (if (t < 0.1f) t / 0.1f else exp(-(t - 0.1f) * 3f)) * 0.7f
        }
    }

    private fun nuke(): FloatArray {
        val n = (1.6f * rate).toInt()
        var lp = 0f
        var ph = 0f
        return FloatArray(n) { i ->
            val t = i / rate.toFloat()
            lp += (noise() - lp) * 0.08f
            ph += (80f * exp(-t * 2f) + 25f) / rate
            tanh((lp * 2.5f + sin(2 * PI.toFloat() * ph) * 1.5f) * exp(-t * 2.2f) * 1.6f)
        }
    }

    private fun death(): FloatArray {
        val n = (1.4f * rate).toInt()
        var ph = 0f
        var lp = 0f
        return FloatArray(n) { i ->
            val t = i / rate.toFloat()
            lp += (noise() - lp) * 0.1f
            ph += (220f * 2f.pow(-t * 3f) + 30f) / rate
            tanh(sin(2 * PI.toFloat() * ph) * 3f) * exp(-t * 2.4f) * 0.8f + lp * exp(-t * 6f)
        }
    }

    /** 4 bars of dark industrial metal-ish loop, 150 BPM, A minor. */
    private fun musicLoop(): FloatArray {
        val bpm = 150f
        val step = 60f / bpm / 2f // 8th notes
        val stepN = (step * rate).toInt()
        val steps = 32
        val out = FloatArray(stepN * steps)
        val root = 55f
        val semis = intArrayOf(
            0, 0, 3, 0, 5, 0, 3, -2,
            0, 0, 3, 0, 7, 5, 3, 0,
            -4, -4, -1, -4, 1, -4, -1, -6,
            0, 0, 3, 0, 5, 7, 8, 7
        )
        var bassPh = 0f
        var kickPh = 0f
        var padA = 0f
        var padB = 0f
        var prevN = 0f
        for (s in 0 until steps) {
            val f = root * 2f.pow(semis[s] / 12f)
            for (k in 0 until stepN) {
                val i = s * stepN + k
                val t = k / rate.toFloat()
                // bass: distorted saw-ish
                bassPh += f / rate
                val saw = (bassPh % 1f) * 2f - 1f
                val bass = tanh(saw * 3.5f) * exp(-t * 4f) * 0.38f
                // kick on every beat
                var kick = 0f
                if (s % 2 == 0) {
                    val tb = t
                    kickPh += (45f + 160f * exp(-tb * 38f)) / rate
                    kick = sin(2 * PI.toFloat() * kickPh) * exp(-tb * 9f) * 0.85f
                }
                // snare on 2 and 4
                val snare = if (s % 4 == 2) noise() * exp(-t * 16f) * 0.45f else 0f
                // hat
                val nz = noise()
                val hat = (nz - prevN) * exp(-t * 55f) * (if (s % 2 == 1) 0.22f else 0.12f)
                prevN = nz
                // pad drone
                padA += (if (s < 16 || s >= 24) 110f else 98f) / rate
                padB += (if (s < 16 || s >= 24) 130.8f else 123.5f) / rate
                val pad = (sin(2 * PI.toFloat() * padA) + sin(2 * PI.toFloat() * padB)) * 0.045f
                val v = bass + kick + snare + hat + pad
                out[i] = tanh(v * 1.3f) * 0.9f
            }
        }
        return out
    }

    private fun wav(data: FloatArray): ByteArray {
        val bos = ByteArrayOutputStream()
        fun i32(v: Int) { for (b in 0..3) bos.write((v shr (8 * b)) and 0xFF) }
        fun i16(v: Int) { for (b in 0..1) bos.write((v shr (8 * b)) and 0xFF) }
        val bytes = data.size * 2
        bos.write("RIFF".toByteArray()); i32(36 + bytes)
        bos.write("WAVE".toByteArray())
        bos.write("fmt ".toByteArray()); i32(16); i16(1); i16(1); i32(rate); i32(rate * 2); i16(2); i16(16)
        bos.write("data".toByteArray()); i32(bytes)
        for (f in data) i16((f.coerceIn(-1f, 1f) * 32767f).toInt())
        return bos.toByteArray()
    }
}
