import { useState } from "react";
import { Search, Sun, Moon, Menu, LogOut, User } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { teacher } from "@/lib/mock-data";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 glass">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search students, courses…" className="h-10 rounded-xl bg-background/70 pl-9" />
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          <IconBtn label="Toggle theme" onClick={toggle}>
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </IconBtn>

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-full border border-border bg-background/60 py-1 pl-1 pr-3 transition hover:bg-background">
              <Avatar className="h-8 w-8">
                <AvatarImage src={teacher.photo} alt={teacher.name} />
                <AvatarFallback>{teacher.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <div className="text-xs font-semibold leading-tight">{teacher.title} {teacher.name.split(" ")[0]}</div>
                <div className="text-[10px] text-muted-foreground">Teacher</div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{teacher.title} {teacher.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/teacher/profile" })}>
                <User className="mr-2 h-4 w-4" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setLogoutOpen(true)}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>You'll need to sign in again to access the Teacher Dashboard.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => setLogoutOpen(false)}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="relative rounded-xl border border-transparent p-2 text-foreground/80 transition hover:border-border hover:bg-background"
    >
      {children}
    </button>
  );
}
