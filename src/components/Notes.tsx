import { Link } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import type { Note } from "@/lib/api";

const date = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export function NoteRows({ notes, admin = false, onDelete }: { notes: Note[]; admin?: boolean; onDelete?: (id: string) => void }) {
  if (!notes.length) return <p className="empty-state">No notes yet. Create one with the New note button.</p>;
  return <div className="note-list">{notes.map((note) => <article key={note._id} className="note-row">
    <div className="note-copy"><h2>{note.title}</h2><p>{note.content}</p>{admin && <span className="note-owner">{note.owner?.name || "Unknown owner"}</span>}</div>
    <div className="note-meta"><time>{date(note.updatedAt)}</time>{!admin && <div className="row-actions"><Link to="/notes/$id/edit" params={{ id: note._id }} className="icon-button" aria-label={`Edit ${note.title}`} title="Edit"><Pencil size={16} strokeWidth={1.5} /></Link>{onDelete && <button className="icon-button danger-action" type="button" onClick={() => onDelete(note._id)} aria-label={`Delete ${note.title}`} title="Delete"><Trash2 size={16} strokeWidth={1.5} /></button>}</div>}</div>
  </article>)}</div>;
}
