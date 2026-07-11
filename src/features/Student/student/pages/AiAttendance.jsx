import { useState } from "react";
import { toast } from "sonner";
import { Camera, CheckCircle2, Clock, MapPin, ScanFace, Sparkles } from "lucide-react";

import SectionCard from "@/components/ui/SectionCard";
import ProgressBar from "@/components/ui/ProgressBar";
import Pill from "@/components/ui/Pill";
import Button from "@/components/ui/Button";
import { aiAttendanceLog } from "@/data/mock/student";

export default function AiAttendance() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const capture = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      setScanning(false);
      const confidence = (95 + Math.random() * 4).toFixed(1);
      setResult({
        confidence,
        course: "Database Systems",
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        location: "Room A-204",
      });
      toast.success("Attendance marked via face recognition");
    }, 2200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">AI Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Mark your attendance instantly with face recognition.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Camera preview */}
        <SectionCard title="Camera Preview" icon={Camera} className="lg:col-span-3" bodyClassName="p-5">
          <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-secondary/40 to-accent/30">
            {/* scanning frame */}
            <div className={`absolute inset-6 rounded-2xl border-2 ${scanning ? "border-primary animate-pulse" : "border-border/60"}`} />
            {scanning && (
              <div className="absolute inset-x-6 top-6 h-0.5 animate-[scan_2s_ease-in-out_infinite] bg-primary shadow-glow" />
            )}
            <div className="relative flex flex-col items-center gap-3 text-center">
              <span className={`grid size-20 place-items-center rounded-full ${scanning ? "gradient-primary text-primary-foreground shadow-glow" : "bg-card text-muted-foreground"}`}>
                <ScanFace className="size-9" />
              </span>
              <p className="text-sm font-medium text-foreground">
                {scanning ? "Analysing face…" : result ? "Recognition complete" : "Position your face in the frame"}
              </p>
            </div>
          </div>

          {/* status */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Face Recognition Status</span>
              <Pill tone={result ? "success" : scanning ? "warning" : "neutral"} dot>
                {result ? "Recognized" : scanning ? "Scanning" : "Idle"}
              </Pill>
            </div>
            <ProgressBar
              value={result ? Number(result.confidence) : scanning ? 60 : 0}
              tone="success"
              label="Recognition Confidence"
            />
            <Button className="w-full" onClick={capture} disabled={scanning}>
              <Camera className="size-4" /> {scanning ? "Scanning…" : "Capture Attendance"}
            </Button>
          </div>
        </SectionCard>

        {/* AI status card */}
        <SectionCard title="Recognition Result" icon={Sparkles} className="lg:col-span-2">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-success/10 p-4">
                <span className="grid size-11 place-items-center rounded-full bg-success/20 text-success">
                  <CheckCircle2 className="size-6" />
                </span>
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">Recognition Successful</p>
                  <p className="text-xs text-muted-foreground">Confidence {result.confidence}%</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4" /> {result.time}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-4" /> {result.location}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><ScanFace className="size-4" /> {result.course}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <ScanFace className="size-5" />
              </span>
              <p className="text-sm text-muted-foreground">Capture attendance to see recognition details.</p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Attendance log */}
      <SectionCard title="Today's Attendance Log" icon={CheckCircle2} bodyClassName="p-0">
        <div className="divide-y divide-border/60">
          {aiAttendanceLog.map((l) => (
            <div key={l.id} className="flex items-center gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
                <CheckCircle2 className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{l.course}</p>
                <p className="truncate text-xs text-muted-foreground">{l.time} · {l.location}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-success">{l.confidence}%</p>
                <Pill tone="success">{l.status}</Pill>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
