import { useRef } from 'react';
import { Upload, Paperclip, Trash2, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TicketAttachment, User } from '@/types';
import { formatFileSize, formatDateTime } from '@/lib/utils';

interface AttachmentUploadProps {
  attachments: TicketAttachment[];
  currentUser: User;
  onUpload: (file: File) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
}

export function AttachmentUpload({
  attachments,
  currentUser,
  onUpload,
  onDelete,
}: AttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((att) => {
            const uploader = typeof att.uploadedBy === 'object' ? att.uploadedBy as User : null;
            const isOwn = uploader?._id === currentUser._id;
            const isImage = att.mimetype.startsWith('image/');

            return (
              <li
                key={att._id}
                className="flex items-center gap-3 rounded-md border p-3 text-sm"
              >
                {isImage ? (
                  <Image className="h-4 w-4 text-blue-500 shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-red-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{att.originalName}</p>
                  <p className="text-xs text-fixflow-muted">
                    {formatFileSize(att.size)} · {uploader?.name ?? 'Unknown'} ·{' '}
                    {formatDateTime(att.createdAt)}
                  </p>
                </div>
                {(isOwn || currentUser.role === 'admin') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-fixflow-muted hover:text-destructive shrink-0"
                    onClick={() => onDelete(att._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
        <p className="mt-1 text-xs text-fixflow-muted">Images and PDFs up to 10MB</p>
      </div>
    </div>
  );
}
