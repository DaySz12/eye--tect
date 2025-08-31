"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import {
  Camera, CheckCircle2, Eye, ShieldQuestion, ShieldCheck,
  Loader2, UserPlus, LogIn, AlertCircle, RotateCcw
} from "lucide-react";

export default function IrisLoginPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamOn, setStreamOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [deviceId, setDeviceId] = useState<string | undefined>();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [crop, setCrop] = useState({ w: 260, h: 260 });

  // enumerate cameras
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices?.()
      .then((list) => {
        const cams = list.filter((d) => d.kind === "videoinput");
        setDevices(cams);
        if (cams.length && !deviceId) setDeviceId(cams[0].deviceId);
      })
      .catch(() => {});
  }, []);

  // start camera
  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamOn(true);
      }
    } catch (e: any) {
      setError(e?.message || "Cannot access camera");
    }
  };

  const stop = () => {
    const v = videoRef.current;
    if (v && v.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      v.srcObject = null;
    }
    setStreamOn(false);
  };

  // overlay (fixed circle)
  const Overlay = () => (
    <div className={styles.overlayCenter}>
      <div className={styles.overlayCircle} style={{ width: crop.w, height: crop.h }}>
        <div className={styles.overlayCircleRing} />
        <div className={styles.overlayDot} />
      </div>
    </div>
  );

  const capturePatch = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || !v.videoWidth || !v.videoHeight) return null;
    const size = Math.min(v.videoWidth, v.videoHeight);
    const sx = (v.videoWidth - size) / 2;
    const sy = (v.videoHeight - size) / 2;
    c.width = crop.w; c.height = crop.h;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, sx, sy, size, size, 0, 0, crop.w, crop.h);
    return c.toDataURL("image/jpeg", 0.95);
  };

  const callApi = async (path: "/api/enroll" | "/api/verify") => {
    setBusy(true); setMessage(""); setError(""); setScore(null);
    try {
      const eyePatchBase64 = capturePatch();
      if (!eyePatchBase64) throw new Error("No frame captured");
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eyePatchBase64 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      if (json.ok) {
        setMessage(path === "/api/enroll" ? "ลงทะเบียนดวงตาสำเร็จ" : "ยืนยันตัวตนสำเร็จ – เข้าสู่ระบบแล้ว");
      } else {
        setError(json.error || "ไม่ผ่านการยืนยันตัวตน");
      }
      if (typeof json.score === "number") setScore(json.score);
    } catch (e: any) {
      setError(e?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const canInteract = streamOn && !busy;

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <h1 className={styles.title}><Eye width={28} height={28} /> Login</h1>
        <p className={styles.subtitle}>
          ระบบสแกนดวงตาเพื่อยืนยันตัวตน (เดโม่ฟรอนต์เอนด์) — กด Start เพื่อเปิดกล้อง จัดตำแหน่งตาให้อยู่ในวง แล้วกด Enroll/Verify
        </p>

        <div className={styles.grid}>
          {/* Camera Panel */}
          <div>
            <div className={styles.videoWrap}>
              <video ref={videoRef} playsInline muted className={styles.video} />
              {streamOn && <Overlay />}
            </div>

            <div className={styles.row}>
              {!streamOn ? (
                <button onClick={start} className={`${styles.btn} ${styles.btnPrimary}`}>
                  <Camera width={16} height={16} /> Start Camera
                </button>
              ) : (
                <button onClick={stop} className={`${styles.btn} ${styles.btnGhost}`}>
                  <RotateCcw width={16} height={16} /> Stop
                </button>
              )}

              <div className={styles.rowRight}>
                <span>กล้อง:</span>
                <select
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className={styles.select}
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 4)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.rangeRow}>
              <label className={styles.statusMuted}>Crop</label>
              <input
                type="range" min={160} max={360} value={crop.w}
                onChange={(e) => setCrop({ w: +e.target.value, h: +e.target.value })}
                className={styles.range}
              />
              <span className={styles.statusMuted}>{crop.w}×{crop.h}</span>
            </div>

            <canvas ref={canvasRef} className={styles.hiddenCanvas} />
          </div>

          {/* Actions / Status */}
          <div className="right">
            <div className={styles.card}>
              <h2 className={styles.statusTitle}><ShieldQuestion width={20} height={20} /> ขั้นตอน</h2>
              <ol style={{ color: "#cbd5e1", marginTop: 8, lineHeight: 1.7, fontSize: 14 }}>
                <li>กด <b>Start Camera</b> และให้ตาอยู่ในวง</li>
                <li>กด <b>Enroll</b> เพื่อบันทึกเทมเพลต (ครั้งแรกเท่านั้น)</li>
                <li>กด <b>Verify</b> เพื่อเข้าสู่ระบบ</li>
              </ol>
            </div>

            <div className={styles.actionsGrid} style={{ marginTop: 12 }}>
              <button disabled={!canInteract} onClick={() => callApi("/api/enroll")} className={styles.btn} style={{ background: "#10b981", color: "#fff" }}>
                {busy ? <Loader2 width={16} height={16} className="spin" /> : <UserPlus width={16} height={16} />} Enroll
              </button>
              <button disabled={!canInteract} onClick={() => callApi("/api/verify")} className={styles.btn} style={{ background: "#0ea5e9", color: "#fff" }}>
                {busy ? <Loader2 width={16} height={16} className="spin" /> : <LogIn width={16} height={16} />} Verify
              </button>
            </div>

            <div className={styles.card} style={{ marginTop: 12, minHeight: 104 }}>
              <h2 className={styles.statusTitle}><ShieldCheck width={20} height={20} /> สถานะ</h2>
              <div style={{ marginTop: 8, fontSize: 14 }}>
                {message && (
                  <p className={styles.statusOk}><CheckCircle2 width={16} height={16} /> {message}</p>
                )}
                {error && (
                  <p className={styles.statusErr}><AlertCircle width={16} height={16} /> {error}</p>
                )}
                {typeof score === "number" && (
                  <p style={{ color: "#cbd5e1", marginTop: 6 }}>score: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>{score.toFixed(4)}</span></p>
                )}
                {!message && !error && (
                  <p className={styles.statusMuted}>พร้อมเริ่มได้ทันทีหลังเปิดกล้อง</p>
                )}
              </div>
            </div>

            <p className={styles.statusMuted} style={{ fontSize: 12, lineHeight: 1.6, marginTop: 10 }}>
              หมายเหตุ: หน้านี้เป็นเดโม่ฟรอนต์เอนด์ — ฝั่งแบ็กเอนด์ต้องจัดการ <em>iris segmentation</em>, <em>feature extraction</em>, <em>matching</em> และ <em>liveness</em>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

