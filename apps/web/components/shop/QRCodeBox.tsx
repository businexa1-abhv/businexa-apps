import { RemoteImage } from '@/components/common/RemoteImage';

export function QRCodeBox({ url, label = 'Shop QR' }: { url: string; label?: string }) {
  if (!url) return <p className="text-sm text-textLight">No QR code yet. Subscribe and generate from the dashboard.</p>;
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-white p-4">
      <p className="text-sm font-medium text-secondary">{label}</p>
      <RemoteImage src={url} alt="QR code" width={160} height={160} className="h-40 w-40 object-contain" />
    </div>
  );
}
