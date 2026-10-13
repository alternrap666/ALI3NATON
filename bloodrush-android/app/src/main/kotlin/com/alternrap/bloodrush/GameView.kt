package com.alternrap.bloodrush

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.graphics.Typeface
import android.view.MotionEvent
import android.view.SurfaceHolder
import android.view.SurfaceView
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.random.Random

private const val MENU = 0
private const val PLAY = 1
private const val OVER = 2

private const val WALKER = 0
private const val RUNNER = 1
private const val FATTY = 2
private const val BOSS = 3

private const val PISTOL = 0
private const val SHOTGUN = 1
private const val MINIGUN = 2
private const val NUKE = 3

private class Zombie(var x: Float, var y: Float, val type: Int, wave: Int) {
    var hp: Float = when (type) {
        WALKER -> 3f
        RUNNER -> 2f
        FATTY -> 10f
        else -> 60f + wave * 6f
    }
    val maxHp = hp
    val r: Float = when (type) { WALKER -> 1f; RUNNER -> 0.8f; FATTY -> 1.5f; else -> 3f }
    val speed: Float = when (type) { WALKER -> 60f; RUNNER -> 130f; FATTY -> 40f; else -> 55f }
    val dmg: Float = when (type) { WALKER -> 8f; RUNNER -> 6f; FATTY -> 14f; else -> 30f }
    var flash = 0f
    var phase = Random.nextFloat() * 6.28f
}

private class Bullet(var x: Float, var y: Float, val vx: Float, val vy: Float, val dmg: Float, var life: Float)

private class Particle(
    var x: Float, var y: Float, var vx: Float, var vy: Float,
    var life: Float, val size: Float, val color: Int, val gib: Boolean
)

private class Pickup(val x: Float, val y: Float, val kind: Int, var life: Float)

private class FloatText(val x: Float, var y: Float, val text: String, var life: Float, val color: Int)

class GameView(context: Context) : SurfaceView(context), SurfaceHolder.Callback, Runnable {

    private val d = resources.displayMetrics.density
    private val rnd = Random(System.nanoTime())
    private var thread: Thread? = null
    @Volatile private var running = false
    @Volatile private var surfaceReady = false

    // Screen / persistent blood layer
    private var w = 0
    private var h = 0
    private var floor: Bitmap? = null
    private var floorCanvas: Canvas? = null
    private var vignette: RadialGradient? = null

    // State
    private var state = MENU
    @Volatile private var wantStart = false
    private var overTimer = 0f

    private var px = 0f
    private var py = 0f
    private var hp = 100f
    private var aimAngle = 0f
    private var fireCd = 0f
    private var weapon = PISTOL
    private var weaponTime = 0f
    private var hurtCd = 0f
    private var score = 0
    private var kills = 0
    private var combo = 0
    private var comboTimer = 0f
    private var wave = 0
    private var toSpawn = 0
    private var spawnTimer = 0f
    private var waveBreak = 0f
    private var shake = 0f
    private var hurtFlash = 0f
    private var time = 0f
    private var best = 0

    private val zombies = ArrayList<Zombie>()
    private val bullets = ArrayList<Bullet>()
    private val parts = ArrayList<Particle>()
    private val pickups = ArrayList<Pickup>()
    private val texts = ArrayList<FloatText>()

    // Touch (written on UI thread, read on game thread)
    @Volatile private var moveId = -1
    @Volatile private var aimId = -1
    @Volatile private var mox = 0f
    @Volatile private var moy = 0f
    @Volatile private var mx = 0f
    @Volatile private var my = 0f
    @Volatile private var aox = 0f
    @Volatile private var aoy = 0f
    @Volatile private var ax = 0f
    @Volatile private var ay = 0f
    private val stickR = 55f * d

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val bloodPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val text = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    }
    private val prefs = context.getSharedPreferences("bloodrush", Context.MODE_PRIVATE)

    init {
        holder.addCallback(this)
        best = prefs.getInt("best", 0)
        isFocusable = true
    }

    // ---------------------------------------------------------------- lifecycle

    fun resumeGame() {
        running = true
        if (surfaceReady && thread == null) startThread()
    }

    fun pauseGame() {
        running = false
        thread?.join(500)
        thread = null
    }

    private fun startThread() {
        thread = Thread(this).also { it.start() }
    }

    override fun surfaceCreated(holder: SurfaceHolder) {
        surfaceReady = true
        if (running && thread == null) startThread()
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        if (width != w || height != h) {
            w = width
            h = height
            buildFloor()
            vignette = RadialGradient(
                w / 2f, h / 2f, hypot(w.toFloat(), h.toFloat()) / 2f,
                intArrayOf(Color.TRANSPARENT, Color.TRANSPARENT, Color.argb(200, 120, 0, 0)),
                floatArrayOf(0f, 0.55f, 1f), Shader.TileMode.CLAMP
            )
            px = w / 2f
            py = h / 2f
        }
    }

    override fun surfaceDestroyed(holder: SurfaceHolder) {
        surfaceReady = false
        pauseGame()
        running = true // keep intent so onResume restarts; thread restarts via surfaceCreated
    }

    private fun buildFloor() {
        floor?.recycle()
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val c = Canvas(bmp)
        c.drawColor(Color.rgb(24, 22, 24))
        val tile = 64f * d
        paint.style = Paint.Style.FILL
        var ty = 0f
        var row = 0
        while (ty < h) {
            var tx = 0f
            var col = 0
            while (tx < w) {
                val v = 28 + ((row * 7 + col * 13) % 5) * 3
                paint.color = Color.rgb(v, v - 2, v)
                c.drawRect(tx + 2, ty + 2, tx + tile - 2, ty + tile - 2, paint)
                tx += tile
                col++
            }
            ty += tile
            row++
        }
        floor = bmp
        floorCanvas = c
    }

    // ---------------------------------------------------------------- game loop

    override fun run() {
        var last = System.nanoTime()
        while (running && surfaceReady) {
            val now = System.nanoTime()
            val dt = min(0.05f, (now - last) / 1_000_000_000f)
            last = now
            update(dt)
            val canvas = try { holder.lockCanvas() } catch (e: Exception) { null }
            if (canvas != null) {
                try { render(canvas) } finally {
                    try { holder.unlockCanvasAndPost(canvas) } catch (_: Exception) {}
                }
            }
            val spent = (System.nanoTime() - now) / 1_000_000L
            if (spent < 16) try { Thread.sleep(16 - spent) } catch (_: InterruptedException) {}
        }
    }

    private fun startGame() {
        zombies.clear(); bullets.clear(); parts.clear(); pickups.clear(); texts.clear()
        buildFloor()
        px = w / 2f; py = h / 2f
        hp = 100f; score = 0; kills = 0; combo = 0; comboTimer = 0f
        wave = 0; toSpawn = 0; waveBreak = 1.2f
        weapon = PISTOL; weaponTime = 0f; fireCd = 0f; hurtCd = 0f
        shake = 0f; hurtFlash = 0f
        state = PLAY
    }

    private fun update(dt: Float) {
        time += dt
        if (wantStart) { wantStart = false; startGame() }
        if (state != PLAY) {
            overTimer = max(0f, overTimer - dt)
            updateParticles(dt)
            return
        }

        shake = max(0f, shake - dt * 30f)
        hurtFlash = max(0f, hurtFlash - dt * 2f)
        hurtCd = max(0f, hurtCd - dt)
        fireCd -= dt
        if (comboTimer > 0f) { comboTimer -= dt; if (comboTimer <= 0f) combo = 0 }
        if (weaponTime > 0f) { weaponTime -= dt; if (weaponTime <= 0f) weapon = PISTOL }

        // Movement
        var dx = (mx - mox) / stickR
        var dy = (my - moy) / stickR
        if (moveId == -1) { dx = 0f; dy = 0f }
        val ml = hypot(dx, dy)
        if (ml > 1f) { dx /= ml; dy /= ml }
        if (ml > 0.12f) {
            val sp = 210f * d
            px += dx * sp * dt
            py += dy * sp * dt
        }
        px = px.coerceIn(16f * d, w - 16f * d)
        py = py.coerceIn(16f * d, h - 16f * d)

        // Aim + fire
        var adx = (ax - aox) / stickR
        var ady = (ay - aoy) / stickR
        if (aimId == -1) { adx = 0f; ady = 0f }
        val al = hypot(adx, ady)
        if (al > 0.2f) {
            aimAngle = atan2(ady, adx)
            if (fireCd <= 0f) fire()
        }

        // Waves
        if (toSpawn == 0 && zombies.isEmpty()) {
            waveBreak -= dt
            if (waveBreak <= 0f) nextWave()
        }
        if (toSpawn > 0) {
            spawnTimer -= dt
            if (spawnTimer <= 0f) {
                spawnTimer = max(0.25f, 1.1f - wave * 0.06f)
                spawnZombie()
                toSpawn--
            }
        }

        updateZombies(dt)
        updateBullets(dt)
        updateParticles(dt)

        val pi = pickups.iterator()
        while (pi.hasNext()) {
            val p = pi.next()
            p.life -= dt
            if (p.life <= 0f) { pi.remove(); continue }
            if (hypot(p.x - px, p.y - py) < 30f * d) {
                pi.remove()
                if (p.kind == NUKE) {
                    nuke()
                } else {
                    weapon = p.kind
                    weaponTime = 15f
                    addText(px, py - 30f * d, weaponName(weapon), Color.YELLOW)
                }
            }
        }
        val ti = texts.iterator()
        while (ti.hasNext()) {
            val t = ti.next()
            t.life -= dt
            t.y -= 30f * d * dt
            if (t.life <= 0f) ti.remove()
        }

        if (hp <= 0f) gameOver()
    }

    private fun nextWave() {
        wave++
        toSpawn = 5 + wave * 3
        spawnTimer = 0f
        waveBreak = 2.5f
        if (wave % 5 == 0) {
            val (bx, by) = edgePoint()
            zombies.add(Zombie(bx, by, BOSS, wave))
            addText(w / 2f, h * 0.3f, "BOSS", Color.RED)
        }
        addText(w / 2f, h * 0.4f, "WAVE $wave", Color.WHITE)
    }

    private fun edgePoint(): Pair<Float, Float> {
        val m = 40f * d
        return when (rnd.nextInt(4)) {
            0 -> Pair(-m, rnd.nextFloat() * h)
            1 -> Pair(w + m, rnd.nextFloat() * h)
            2 -> Pair(rnd.nextFloat() * w, -m)
            else -> Pair(rnd.nextFloat() * w, h + m)
        }
    }

    private fun spawnZombie() {
        val (x, y) = edgePoint()
        val roll = rnd.nextFloat()
        val type = when {
            wave >= 3 && roll < 0.15f -> FATTY
            wave >= 2 && roll < 0.45f -> RUNNER
            else -> WALKER
        }
        zombies.add(Zombie(x, y, type, wave))
    }

    private fun weaponName(k: Int) = when (k) {
        SHOTGUN -> "SHOTGUN"; MINIGUN -> "MINIGUN"; NUKE -> "NUKE"; else -> "PISTOL"
    }

    private fun fire() {
        val muzzle = 22f * d
        val ox = px + cos(aimAngle) * muzzle
        val oy = py + sin(aimAngle) * muzzle
        val speed = 900f * d
        when (weapon) {
            SHOTGUN -> {
                fireCd = 0.6f
                repeat(8) {
                    val a = aimAngle + (rnd.nextFloat() - 0.5f) * 0.5f
                    val s = speed * (0.7f + rnd.nextFloat() * 0.4f)
                    bullets.add(Bullet(ox, oy, cos(a) * s, sin(a) * s, 1.4f, 0.35f))
                }
                shake = max(shake, 6f)
                px -= cos(aimAngle) * 6f * d
                py -= sin(aimAngle) * 6f * d
            }
            MINIGUN -> {
                fireCd = 0.06f
                val a = aimAngle + (rnd.nextFloat() - 0.5f) * 0.14f
                bullets.add(Bullet(ox, oy, cos(a) * speed, sin(a) * speed, 1f, 0.8f))
                shake = max(shake, 2f)
            }
            else -> {
                fireCd = 0.26f
                val a = aimAngle + (rnd.nextFloat() - 0.5f) * 0.04f
                bullets.add(Bullet(ox, oy, cos(a) * speed, sin(a) * speed, 1.6f, 0.9f))
                shake = max(shake, 2f)
            }
        }
        // Brass-ish spark
        parts.add(Particle(ox, oy, (rnd.nextFloat() - 0.5f) * 200f * d, (rnd.nextFloat() - 0.5f) * 200f * d,
            0.15f, 2f * d, Color.rgb(255, 210, 90), false))
    }

    private fun updateZombies(dt: Float) {
        val it = zombies.iterator()
        while (it.hasNext()) {
            val z = it.next()
            z.flash = max(0f, z.flash - dt * 6f)
            z.phase += dt * 8f
            val dx = px - z.x
            val dy = py - z.y
            val dist = max(1f, hypot(dx, dy))
            val sp = z.speed * d * (1f + wave * 0.015f)
            z.x += dx / dist * sp * dt
            z.y += dy / dist * sp * dt
            val rr = z.r * 14f * d
            if (dist < rr + 12f * d && hurtCd <= 0f) {
                hp -= z.dmg
                hurtCd = 0.45f
                hurtFlash = 1f
                shake = max(shake, 14f)
                bloodBurst(px, py, 8, 120f * d, 3f * d)
                splat(px, py, 14f * d)
            }
        }
        // Soft separation so the horde doesn't collapse to a single point.
        for (i in 0 until zombies.size) {
            val a = zombies[i]
            for (j in i + 1 until zombies.size) {
                val b = zombies[j]
                val minD = (a.r + b.r) * 11f * d
                val ddx = b.x - a.x
                val ddy = b.y - a.y
                val dd = hypot(ddx, ddy)
                if (dd in 0.01f..minD) {
                    val push = (minD - dd) * 0.5f / dd
                    a.x -= ddx * push; a.y -= ddy * push
                    b.x += ddx * push; b.y += ddy * push
                }
            }
        }
    }

    private fun updateBullets(dt: Float) {
        val bi = bullets.iterator()
        outer@ while (bi.hasNext()) {
            val b = bi.next()
            b.x += b.vx * dt
            b.y += b.vy * dt
            b.life -= dt
            if (b.life <= 0f || b.x < -50 || b.y < -50 || b.x > w + 50 || b.y > h + 50) { bi.remove(); continue }
            for (z in zombies) {
                if (z.hp <= 0f) continue
                if (hypot(z.x - b.x, z.y - b.y) < z.r * 14f * d) {
                    z.hp -= b.dmg
                    z.flash = 1f
                    val ang = atan2(b.vy, b.vx)
                    // Spray out the back of the target
                    for (k in 0 until 5) {
                        val a = ang + (rnd.nextFloat() - 0.5f) * 0.9f
                        val s = (150f + rnd.nextFloat() * 350f) * d
                        parts.add(Particle(z.x, z.y, cos(a) * s, sin(a) * s, 0.5f + rnd.nextFloat() * 0.4f,
                            (1.5f + rnd.nextFloat() * 2.5f) * d, bloodColor(), false))
                    }
                    splat(z.x + cos(ang) * 14f * d, z.y + sin(ang) * 14f * d, 7f * d * z.r)
                    z.x += cos(ang) * 4f * d
                    z.y += sin(ang) * 4f * d
                    bi.remove()
                    if (z.hp <= 0f) killZombie(z, ang)
                    continue@outer
                }
            }
        }
        zombies.removeAll { it.hp <= 0f }
    }

    private fun killZombie(z: Zombie, ang: Float) {
        kills++
        combo++
        comboTimer = 2.5f
        val gain = when (z.type) { WALKER -> 10; RUNNER -> 15; FATTY -> 40; else -> 500 } * max(1, combo / 3)
        score += gain
        val overkill = -z.hp
        val chunks = ((8 + rnd.nextInt(8)) * z.r).toInt() + (overkill * 4f).toInt()
        // Explosion of meat
        for (i in 0 until chunks) {
            val a = if (rnd.nextFloat() < 0.6f) ang + (rnd.nextFloat() - 0.5f) * 1.4f else rnd.nextFloat() * 6.28f
            val s = (100f + rnd.nextFloat() * 500f) * d
            parts.add(Particle(z.x, z.y, cos(a) * s, sin(a) * s, 0.6f + rnd.nextFloat() * 0.8f,
                (2f + rnd.nextFloat() * 5f) * d * max(1f, z.r * 0.7f), gibColor(), true))
        }
        bloodBurst(z.x, z.y, 22, 450f * d, 3.5f * d)
        val big = 22f * d * z.r
        splat(z.x, z.y, big)
        splat(z.x + cos(ang) * big, z.y + sin(ang) * big, big * 0.8f)
        // Long drag mark behind the corpse
        streak(z.x, z.y, ang, big * 2.5f)
        shake = max(shake, if (z.type == BOSS) 30f else 8f)
        if (combo >= 3 && combo % 3 == 0) addText(z.x, z.y - 20f * d, "x$combo  GORE!", Color.rgb(255, 60, 60))
        if (z.type == BOSS || rnd.nextFloat() < 0.07f) {
            val kind = if (z.type == BOSS) NUKE else 1 + rnd.nextInt(2)
            pickups.add(Pickup(z.x.coerceIn(30f * d, w - 30f * d), z.y.coerceIn(30f * d, h - 30f * d), kind, 12f))
        }
        if (rnd.nextFloat() < 0.04f) hp = min(100f, hp + 10f)
    }

    private fun nuke() {
        addText(w / 2f, h / 2f, "BLOOD NOVA", Color.RED)
        for (z in zombies) {
            z.hp = 0f
            for (i in 0 until 25) {
                val a = rnd.nextFloat() * 6.28f
                val s = (100f + rnd.nextFloat() * 700f) * d
                parts.add(Particle(z.x, z.y, cos(a) * s, sin(a) * s, 0.6f + rnd.nextFloat(),
                    (2f + rnd.nextFloat() * 5f) * d, gibColor(), true))
            }
            bloodBurst(z.x, z.y, 20, 500f * d, 3.5f * d)
            splat(z.x, z.y, 30f * d * z.r)
            score += 25
            kills++
        }
        zombies.clear()
        shake = 40f
    }

    private fun gameOver() {
        state = OVER
        overTimer = 1.2f
        shake = 40f
        bloodBurst(px, py, 60, 600f * d, 4f * d)
        for (i in 0 until 40) {
            val a = rnd.nextFloat() * 6.28f
            val s = (100f + rnd.nextFloat() * 500f) * d
            parts.add(Particle(px, py, cos(a) * s, sin(a) * s, 1f + rnd.nextFloat(), (2f + rnd.nextFloat() * 5f) * d, gibColor(), true))
        }
        splat(px, py, 60f * d)
        if (score > best) {
            best = score
            prefs.edit().putInt("best", best).apply()
        }
    }

    private fun updateParticles(dt: Float) {
        val it = parts.iterator()
        val fc = floorCanvas
        while (it.hasNext()) {
            val p = it.next()
            p.x += p.vx * dt
            p.y += p.vy * dt
            val drag = 1f - 3.2f * dt
            p.vx *= drag
            p.vy *= drag
            p.life -= dt
            if (p.life <= 0f) {
                // Landed: leave a permanent stain on the floor.
                if (fc != null && p.x > 0 && p.y > 0 && p.x < w && p.y < h) {
                    bloodPaint.color = if (p.gib) gibColor(150) else bloodColor(190)
                    fc.drawCircle(p.x, p.y, p.size * (if (p.gib) 1.1f else 0.9f), bloodPaint)
                }
                it.remove()
            }
        }
    }

    // ---------------------------------------------------------------- gore helpers

    private fun bloodColor(alpha: Int = 255) = Color.argb(alpha, 120 + rnd.nextInt(100), rnd.nextInt(20), rnd.nextInt(20))
    private fun gibColor(alpha: Int = 255) = Color.argb(alpha, 70 + rnd.nextInt(80), rnd.nextInt(30), rnd.nextInt(30))

    private fun bloodBurst(x: Float, y: Float, n: Int, speed: Float, size: Float) {
        for (i in 0 until n) {
            val a = rnd.nextFloat() * 6.28f
            val s = speed * (0.2f + rnd.nextFloat())
            parts.add(Particle(x, y, cos(a) * s, sin(a) * s, 0.4f + rnd.nextFloat() * 0.7f,
                size * (0.4f + rnd.nextFloat()), bloodColor(), false))
        }
    }

    private fun splat(x: Float, y: Float, size: Float) {
        val fc = floorCanvas ?: return
        val n = 4 + rnd.nextInt(6)
        for (i in 0 until n) {
            val a = rnd.nextFloat() * 6.28f
            val dd = rnd.nextFloat() * size
            val r = size * (0.15f + rnd.nextFloat() * 0.45f)
            bloodPaint.color = bloodColor(110 + rnd.nextInt(100))
            fc.drawCircle(x + cos(a) * dd, y + sin(a) * dd, r, bloodPaint)
        }
        bloodPaint.color = Color.argb(200, 90, 0, 0)
        fc.drawCircle(x, y, size * 0.5f, bloodPaint)
    }

    private fun streak(x: Float, y: Float, ang: Float, len: Float) {
        val fc = floorCanvas ?: return
        val steps = 14
        for (i in 0 until steps) {
            val t = i / steps.toFloat()
            val r = (1f - t) * 7f * d + 1.5f * d
            bloodPaint.color = bloodColor(130)
            fc.drawCircle(
                x + cos(ang) * len * t + (rnd.nextFloat() - 0.5f) * 4f * d,
                y + sin(ang) * len * t + (rnd.nextFloat() - 0.5f) * 4f * d, r, bloodPaint
            )
        }
    }

    private fun addText(x: Float, y: Float, s: String, color: Int) {
        texts.add(FloatText(x, y, s, 1.3f, color))
    }

    // ---------------------------------------------------------------- rendering

    private fun render(c: Canvas) {
        c.drawColor(Color.BLACK)
        val f = floor ?: return
        c.save()
        if (shake > 0f) c.translate((rnd.nextFloat() - 0.5f) * shake, (rnd.nextFloat() - 0.5f) * shake)
        c.drawBitmap(f, 0f, 0f, null)

        for (p in pickups) drawPickup(c, p)
        for (z in zombies) drawZombie(c, z)
        if (state == PLAY) drawPlayer(c)

        // Flying gore on top of everything
        paint.style = Paint.Style.FILL
        for (p in parts) {
            paint.color = p.color
            if (p.gib) {
                c.drawRect(p.x - p.size, p.y - p.size * 0.7f, p.x + p.size, p.y + p.size * 0.7f, paint)
            } else {
                c.drawCircle(p.x, p.y, p.size, paint)
            }
        }
        for (b in bullets) {
            paint.color = Color.rgb(255, 235, 150)
            paint.strokeWidth = 2.5f * d
            paint.style = Paint.Style.STROKE
            c.drawLine(b.x, b.y, b.x - b.vx * 0.02f, b.y - b.vy * 0.02f, paint)
        }
        paint.style = Paint.Style.FILL

        for (t in texts) {
            text.color = t.color
            text.alpha = (255 * min(1f, t.life)).toInt()
            text.textSize = 20f * d
            text.textAlign = Paint.Align.CENTER
            c.drawText(t.text, t.x, t.y, text)
        }
        c.restore()

        drawOverlay(c)
        if (state == PLAY) drawSticks(c)
        drawHud(c)
        if (state == MENU) drawMenu(c)
        if (state == OVER) drawGameOver(c)
    }

    private fun drawPickup(c: Canvas, p: Pickup) {
        val pulse = 1f + 0.15f * sin(time * 8f)
        paint.style = Paint.Style.FILL
        paint.color = if (p.kind == NUKE) Color.argb(220, 255, 0, 0) else Color.argb(220, 255, 200, 0)
        c.drawCircle(p.x, p.y, 16f * d * pulse, paint)
        text.color = Color.BLACK
        text.alpha = 255
        text.textSize = 12f * d
        text.textAlign = Paint.Align.CENTER
        c.drawText(weaponName(p.kind).take(3), p.x, p.y + 4f * d, text)
    }

    private fun drawZombie(c: Canvas, z: Zombie) {
        val r = z.r * 14f * d
        paint.style = Paint.Style.FILL
        paint.color = Color.argb(90, 0, 0, 0)
        c.drawOval(z.x - r, z.y + r * 0.6f, z.x + r, z.y + r * 1.2f, paint)

        val a = atan2(py - z.y, px - z.x)
        val body = when (z.type) {
            RUNNER -> Color.rgb(150, 110, 70)
            FATTY -> Color.rgb(110, 130, 60)
            BOSS -> Color.rgb(150, 30, 60)
            else -> Color.rgb(90, 130, 90)
        }
        // Arms reaching forward, swinging
        val sw = sin(z.phase) * 0.35f
        paint.color = body
        for (side in intArrayOf(-1, 1)) {
            val aa = a + side * (0.5f + sw * side)
            c.drawCircle(z.x + cos(aa) * r * 1.15f, z.y + sin(aa) * r * 1.15f, r * 0.34f, paint)
        }
        paint.color = if (z.flash > 0f) Color.WHITE else body
        c.drawCircle(z.x, z.y, r, paint)
        // Wounds grow as hp falls
        val dmg = 1f - z.hp / z.maxHp
        if (dmg > 0.2f) {
            paint.color = Color.argb(200, 140, 0, 0)
            c.drawCircle(z.x - r * 0.3f, z.y + r * 0.2f, r * 0.35f * dmg + 2f, paint)
            if (dmg > 0.6f) c.drawCircle(z.x + r * 0.35f, z.y - r * 0.1f, r * 0.3f, paint)
        }
        paint.color = Color.rgb(255, 30, 30)
        c.drawCircle(z.x + cos(a - 0.45f) * r * 0.6f, z.y + sin(a - 0.45f) * r * 0.6f, max(1.5f * d, r * 0.13f), paint)
        c.drawCircle(z.x + cos(a + 0.45f) * r * 0.6f, z.y + sin(a + 0.45f) * r * 0.6f, max(1.5f * d, r * 0.13f), paint)

        if (z.type == BOSS) {
            paint.color = Color.argb(200, 40, 0, 0)
            c.drawRect(z.x - r, z.y - r - 12f * d, z.x + r, z.y - r - 6f * d, paint)
            paint.color = Color.RED
            c.drawRect(z.x - r, z.y - r - 12f * d, z.x - r + 2f * r * z.hp / z.maxHp, z.y - r - 6f * d, paint)
        }
    }

    private fun drawPlayer(c: Canvas) {
        paint.style = Paint.Style.FILL
        paint.color = Color.argb(90, 0, 0, 0)
        c.drawOval(px - 14f * d, py + 8f * d, px + 14f * d, py + 18f * d, paint)
        // Gun
        paint.color = Color.rgb(60, 60, 66)
        paint.strokeWidth = (if (weapon == MINIGUN) 7f else 5f) * d
        paint.style = Paint.Style.STROKE
        c.drawLine(px, py, px + cos(aimAngle) * 24f * d, py + sin(aimAngle) * 24f * d, paint)
        paint.style = Paint.Style.FILL
        // Body
        paint.color = if (hurtCd > 0.3f) Color.WHITE else Color.rgb(200, 190, 170)
        c.drawCircle(px, py, 12f * d, paint)
        paint.color = Color.rgb(50, 70, 150)
        c.drawCircle(px - cos(aimAngle) * 3f * d, py - sin(aimAngle) * 3f * d, 8f * d, paint)
    }

    private fun drawOverlay(c: Canvas) {
        val v = vignette ?: return
        val lowHp = if (state == PLAY) max(0f, 1f - hp / 50f) else 1f
        val pulse = 0.6f + 0.4f * sin(time * 6f)
        paint.shader = v
        paint.alpha = (255 * min(1f, lowHp * pulse + 0.25f)).toInt()
        paint.style = Paint.Style.FILL
        c.drawRect(0f, 0f, w.toFloat(), h.toFloat(), paint)
        paint.shader = null
        paint.alpha = 255
        if (hurtFlash > 0f) {
            paint.color = Color.argb((110 * hurtFlash).toInt(), 200, 0, 0)
            c.drawRect(0f, 0f, w.toFloat(), h.toFloat(), paint)
        }
    }

    private fun drawSticks(c: Canvas) {
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 2f * d
        if (moveId != -1) stick(c, mox, moy, mx, my, Color.argb(120, 255, 255, 255))
        if (aimId != -1) stick(c, aox, aoy, ax, ay, Color.argb(140, 255, 60, 60))
        paint.style = Paint.Style.FILL
    }

    private fun stick(c: Canvas, ox: Float, oy: Float, x: Float, y: Float, col: Int) {
        var dx = x - ox
        var dy = y - oy
        val l = hypot(dx, dy)
        if (l > stickR) { dx = dx / l * stickR; dy = dy / l * stickR }
        paint.color = col
        paint.style = Paint.Style.STROKE
        c.drawCircle(ox, oy, stickR, paint)
        paint.style = Paint.Style.FILL
        c.drawCircle(ox + dx, oy + dy, stickR * 0.4f, paint)
    }

    private fun drawHud(c: Canvas) {
        if (state == MENU) return
        text.alpha = 255
        text.textSize = 16f * d
        text.color = Color.WHITE
        text.textAlign = Paint.Align.LEFT
        c.drawText("SCORE $score", 14f * d, 26f * d, text)
        c.drawText("WAVE $wave", 14f * d, 48f * d, text)
        text.textAlign = Paint.Align.RIGHT
        c.drawText("BEST $best", w - 14f * d, 26f * d, text)
        if (weapon != PISTOL) {
            text.color = Color.YELLOW
            c.drawText("${weaponName(weapon)} ${weaponTime.toInt()}s", w - 14f * d, 48f * d, text)
        }
        // HP bar
        val bw = 160f * d
        val bx = w / 2f - bw / 2f
        paint.style = Paint.Style.FILL
        paint.color = Color.argb(160, 0, 0, 0)
        c.drawRect(bx - 2, 10f * d - 2, bx + bw + 2, 22f * d + 2, paint)
        paint.color = if (hp > 35f) Color.rgb(200, 20, 20) else Color.rgb(255, 80, 0)
        c.drawRect(bx, 10f * d, bx + bw * max(0f, hp) / 100f, 22f * d, paint)
        if (combo >= 2 && state == PLAY) {
            text.color = Color.rgb(255, 80, 80)
            text.textAlign = Paint.Align.CENTER
            text.textSize = 18f * d
            c.drawText("COMBO x$combo", w / 2f, 44f * d, text)
        }
    }

    private fun drawMenu(c: Canvas) {
        paint.color = Color.argb(150, 0, 0, 0)
        c.drawRect(0f, 0f, w.toFloat(), h.toFloat(), paint)
        text.textAlign = Paint.Align.CENTER
        text.color = Color.rgb(200, 0, 0)
        text.alpha = 255
        text.textSize = 64f * d
        c.drawText("BLOODRUSH", w / 2f, h * 0.38f, text)
        text.color = Color.WHITE
        text.textSize = 16f * d
        c.drawText("LEFT THUMB: MOVE    RIGHT THUMB: AIM + SHOOT", w / 2f, h * 0.52f, text)
        c.drawText("DISMEMBER THE HORDE. STAY ALIVE.", w / 2f, h * 0.60f, text)
        text.alpha = (160 + 95 * sin(time * 5f)).toInt()
        text.textSize = 22f * d
        c.drawText("TAP TO START", w / 2f, h * 0.78f, text)
        text.alpha = 255
        text.textSize = 14f * d
        c.drawText("BEST $best", w / 2f, h * 0.88f, text)
    }

    private fun drawGameOver(c: Canvas) {
        paint.color = Color.argb(140, 0, 0, 0)
        c.drawRect(0f, 0f, w.toFloat(), h.toFloat(), paint)
        text.textAlign = Paint.Align.CENTER
        text.alpha = 255
        text.color = Color.rgb(200, 0, 0)
        text.textSize = 56f * d
        c.drawText("YOU'RE MEAT", w / 2f, h * 0.38f, text)
        text.color = Color.WHITE
        text.textSize = 20f * d
        c.drawText("SCORE $score   KILLS $kills   WAVE $wave", w / 2f, h * 0.55f, text)
        c.drawText(if (score >= best) "NEW BEST!" else "BEST $best", w / 2f, h * 0.65f, text)
        if (overTimer <= 0f) {
            text.alpha = (160 + 95 * sin(time * 5f)).toInt()
            c.drawText("TAP TO RESPAWN", w / 2f, h * 0.82f, text)
        }
    }

    // ---------------------------------------------------------------- input

    override fun onTouchEvent(e: MotionEvent): Boolean {
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN, MotionEvent.ACTION_POINTER_DOWN -> {
                val i = e.actionIndex
                val id = e.getPointerId(i)
                val x = e.getX(i)
                val y = e.getY(i)
                if (state == MENU || (state == OVER && overTimer <= 0f)) {
                    wantStart = true
                    return true
                }
                if (x < width / 2f) {
                    if (moveId == -1) { moveId = id; mox = x; moy = y; mx = x; my = y }
                } else {
                    if (aimId == -1) { aimId = id; aox = x; aoy = y; ax = x; ay = y }
                }
            }
            MotionEvent.ACTION_MOVE -> {
                for (i in 0 until e.pointerCount) {
                    val id = e.getPointerId(i)
                    if (id == moveId) { mx = e.getX(i); my = e.getY(i) }
                    if (id == aimId) { ax = e.getX(i); ay = e.getY(i) }
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_POINTER_UP -> {
                val id = e.getPointerId(e.actionIndex)
                if (id == moveId) moveId = -1
                if (id == aimId) aimId = -1
            }
            MotionEvent.ACTION_CANCEL -> { moveId = -1; aimId = -1 }
        }
        return true
    }
}
