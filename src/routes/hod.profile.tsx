import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Clock, GraduationCap, Award, Pencil, KeyRound, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { hod } from "@/lib/hod-mock-data";

export const Route = createFileRoute("/hod/profile")({
  head: () => ({ meta: [{ title: "HOD Profile" }] }),
  component: Profile,
});

function Profile() {
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-2xl border-0 gradient-brand text-white shadow-glass">
        <div className="grid gap-6 p-8 md:grid-cols-[auto_1fr_auto] md:items-center">
          <Avatar className="h-24 w-24 ring-4 ring-white/40">
            <AvatarImage src={hod.photo} />
            <AvatarFallback>{hod.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/80">Head of Department</div>
            <h1 className="font-display text-3xl font-bold">{hod.name}</h1>
            <p className="mt-1 text-sm text-white/85">{hod.department} · {hod.college}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="rounded-xl bg-white text-primary hover:bg-white/90"><Pencil className="mr-1.5 h-4 w-4" /> Edit</Button>
            <Button variant="outline" className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20"><KeyRound className="mr-1.5 h-4 w-4" /> Password</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Mail} k="Email" v={hod.email} />
            <Row icon={Phone} k="Phone" v={hod.phone} />
            <Row icon={MapPin} k="Office" v={hod.office} />
            <Row icon={Clock} k="Office Hours" v={hod.officeHours} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle className="text-base">Academic</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Building2} k="Department" v={hod.department} />
            <Row icon={GraduationCap} k="Qualification" v={hod.qualification} />
            <Row icon={Award} k="Experience" v={hod.experience} />
            <Row icon={Clock} k="Session" v={hod.session} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v, icon: Icon }: { k: string; v: string; icon: any }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><span>{k}</span></div>
      <div className="text-right font-medium">{v}</div>
    </div>
  );
}
