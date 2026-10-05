import { BookOpen, Compass, Feather, MessagesSquare, Send, ShieldCheck } from "lucide-react";

const icons = { messages: MessagesSquare, shield: ShieldCheck, pen: Feather, send: Send, compass: Compass, book: BookOpen };

export function StationIcon({ name, size = 24 }: { name: keyof typeof icons; size?: number }) {
  const Icon = icons[name];
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}
