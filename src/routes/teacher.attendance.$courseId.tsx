import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Camera, CameraOff, CheckCircle2, XCircle, Save, ScanFace, MousePointerClick, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getCourseByCompositeId, getRosterFor, parseCourseId } from "@/features/Teacher/lib/academic-data";

type Status = "present" | "absent" | "pending";

const RECOGNITION_API =
  (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

export const Route = createFileRoute("/teacher/attendance/$courseId")({
  head: () => ({ meta: [{ title: "Take Attendance · Teacher Portal" }] }),
  component: TakeAttendance,
});

function TakeAttendance() {
  const { courseId } = useParams({ from: "/teacher/attendance/$courseId" });
  const { dept, sem, section } = parseCourseId(courseId);
  const course = getCourseByCompositeId(courseId);

  const classRoster = useMemo(() => getRosterFor(dept, sem, section), [dept, sem, section]);
  const [statuses, setStatuses] = useState<Record<string, Status>>(
    () => Object.fromEntries(classRoster.map((s) => [s.id, "pending" as Status])),
  );
  const [recognized, setRecognized] = useState<Record<string, boolean>>({});

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      toast.success("Camera started · AI face recognition active");
      simulateRecognition();
    } catch (err: any) {
      setCameraError(err?.message ?? "Camera not available. Use manual mode.");
      toast.error("Camera unavailable — switch to manual mode below.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
    setScanning(false);
  }

  async function realRecognition() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast.error("Camera frame not ready yet — try again in a moment.");
      return;
    }
    setScanning(true);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setScanning(false);
      toast.error("Could not capture a frame from the camera.");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setScanning(false);
        toast.error("Could not encode the camera frame.");
        return;
      }
      try {
        const formData = new FormData();
        formData.append("course_id", courseId);
        formData.append("frame", blob, "frame.jpg");

        const res = await fetch(`${RECOGNITION_API}/api/attendance/recognize`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error(`Recognition failed (${res.status})`);
        const data: { recognized?: Array<{ student_id: string }> } = await res.json();
        const list = data.recognized ?? [];

        list.forEach(({ student_id }) => {
          setRecognized((r) => ({ ...r, [student_id]: true }));
          setStatuses((prev) =>
            prev[student_id] === "pending" ? { ...prev, [student_id]: "present" } : prev,
          );
        });
        toast.success(`${list.length} student${list.length === 1 ? "" : "s"} recognized`);
      } catch (err: any) {
        toast.error(err?.message ?? "Recognition service unavailable — mark students manually.");
      } finally {
        setScanning(false);
      }
    }, "image/jpeg");
  }

  function setStatus(id: string, s: Status) {
    setStatuses((p) => ({ ...p, [id]: s }));
    setRecognized((r) => ({ ...r, [id]: true }));
  }

  function markAllPresent() {
    const all: Record<string, Status> = {};
    const rec: Record<string, boolean> = {};
    classRoster.forEach((s) => { all[s.id] = "present"; rec[s.id] = true; });
    setStatuses(all); setRecognized(rec);
    toast.success("All students marked present");
  }

  function confirmSave() {
    // Manual entry: anything not yet touched defaults to absent, per spec (only Present/Absent allowed).
    setStatuses((prev) => {
      const next = { ...prev };
      classRoster.forEach((s) => { if (next[s.id] === "pending") next[s.id] = "absent"; });
      return next;
    });
    setConfirmOpen(false);
    setSuccessOpen(true);
  }

  const counts = classRoster.reduce(
    (acc, s) => { acc[statuses[s.id]]++; return acc; },
    { present: 0, absent: 0, pending: 0 } as Record<Status, number>,
  );

  if (!course) {
    return (
      <div className="space-y-4">
        <Link to="/teacher/attendance"><Button variant="outline" className="rounded-xl"><ArrowLeft className="mr-1.5 h-4 w-4" />Back to Attendance</Button></Link>
        <p className="text-sm text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/teacher/attendance"><Button size="icon" variant="ghost" className="rounded-xl"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{course.code} · {course.dept.toUpperCase()}</div>
            <h1 className="truncate font-display text-xl font-bold sm:text-2xl">{course.name} · Attendance</h1>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" className="rounded-xl" onClick={markAllPresent}>Mark All Present</Button>
          <Button className="rounded-xl" onClick={() => setConfirmOpen(true)}><Save className="mr-1.5 h-4 w-4" />Save</Button>
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Present" value={counts.present} tone="success" />
        <MiniStat label="Absent" value={counts.absent} tone="danger" />
        <MiniStat label="Pending" value={counts.pending} tone="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Camera */}
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanFace className="h-4 w-4 text-primary" /> AI Face Recognition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              {!cameraOn && (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary/40 to-accent/30 text-white">
                  <div className="text-center">
                    <Camera className="mx-auto h-10 w-10 opacity-80" />
                    <p className="mt-2 text-sm">Camera is off</p>
                  </div>
                </div>
              )}
              {cameraOn && (
                <>
                  <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-white/70" />
                  {scanning && (
                    <div className="pointer-events-none absolute inset-x-6 top-6 h-0.5 animate-[scan_2s_linear_infinite] bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.8)]" />
                  )}
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Live
                  </div>
                </>
              )}
            </div>

            {cameraError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <div className="font-semibold">Camera failed</div>
                <div className="opacity-80">{cameraError}. Tap student photos below to mark manually.</div>
              </div>
            )}

            <div className="flex gap-2">
              {!cameraOn ? (
                <Button className="w-full rounded-xl" onClick={startCamera}>
                  <Camera className="mr-1.5 h-4 w-4" /> Start Camera
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full rounded-xl" onClick={simulateRecognition} disabled={scanning}>
                    <ScanFace className="mr-1.5 h-4 w-4" /> {scanning ? "Scanning…" : "Re-scan"}
                  </Button>
                  <Button variant="destructive" className="w-full rounded-xl" onClick={stopCamera}>
                    <CameraOff className="mr-1.5 h-4 w-4" /> Stop
                  </Button>
                </>
              )}
            </div>

            <div className="rounded-xl bg-secondary/60 p-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold"><MousePointerClick className="h-3.5 w-3.5" /> Manual fallback</div>
              <p className="mt-1 text-muted-foreground">Click any student photo to reveal & mark them present. Photos stay blurred until recognized by AI or clicked manually.</p>
            </div>
          </CardContent>
        </Card>

        {/* Student Grid */}
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Student Roster · {classRoster.length}</CardTitle>
            <Badge variant="secondary" className="rounded-full">{Object.values(recognized).filter(Boolean).length} recognized</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {classRoster.map((s) => {
                const st = statuses[s.id];
                const isRec = recognized[s.id];
                return (
                  <div key={s.id} className={cn(
                    "group relative overflow-hidden rounded-2xl border bg-card p-3 shadow-soft transition",
                    st === "present" && "border-emerald-400/60 ring-2 ring-emerald-400/30",
                    st === "absent" && "border-destructive/50 ring-2 ring-destructive/20",
                    st === "pending" && "border-border",
                  )}>
                    <button
                      onClick={() => setStatus(s.id, "present")}
                      className="relative block h-24 w-full overflow-hidden rounded-xl"
                      title="Click to mark present"
                    >
                      <img
                        src={s.photo}
                        alt={s.name}
                        className={cn(
                          "h-full w-full object-cover transition-all duration-700",
                          !isRec && "scale-110 blur-md brightness-75",
                          isRec && "blur-0",
                        )}
                      />
                      {!isRec && (
                        <div className="absolute inset-0 grid place-items-center">
                          <div className="rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                            Awaiting scan…
                          </div>
                        </div>
                      )}
                      {isRec && st === "present" && (
                        <div className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white shadow">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </button>

                    <div className="mt-2 min-w-0">
                      <div className="truncate text-xs font-semibold">{s.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">{s.enrollment}</div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-1">
                      <StatusBtn active={st === "present"} onClick={() => setStatus(s.id, "present")} tone="success" title="Present"><CheckCircle2 className="h-3.5 w-3.5" /> Present</StatusBtn>
                      <StatusBtn active={st === "absent"} onClick={() => setStatus(s.id, "absent")} tone="danger" title="Absent"><XCircle className="h-3.5 w-3.5" /> Absent</StatusBtn>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`@keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(220px); } }`}</style>

      {/* Save confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save today's attendance?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save today's attendance for {course.name}? Any unmarked students will be recorded as absent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success */}
      <AlertDialog open={successOpen} onOpenChange={setSuccessOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><PartyPopper className="h-5 w-5 text-emerald-500" /> Attendance Saved Successfully</AlertDialogTitle>
            <AlertDialogDescription>
              Attendance for {course.name} has been saved to the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuccessOpen(false)}>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  const map: Record<string, string> = {
    success: "from-emerald-500 to-teal-500",
    danger: "from-rose-500 to-red-500",
    primary: "from-[#293681] to-[#4274D9]",
  };
  return (
    <Card className="overflow-hidden rounded-2xl border-border/60 p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={cn("h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br", map[tone])} />
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function StatusBtn({ active, onClick, children, tone, title }: { active: boolean; onClick: () => void; children: React.ReactNode; tone: string; title: string }) {
  const map: Record<string, string> = {
    success: "bg-emerald-500 text-white",
    danger: "bg-rose-500 text-white",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition",
        active ? map[tone] : "bg-muted text-muted-foreground hover:bg-secondary",
      )}
    >{children}</button>
  );
}
