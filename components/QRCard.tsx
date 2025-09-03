export default function QRCard({ url, imgUrl }: { url: string; imgUrl?: string | null }) {
  return (
    <div className="border rounded p-4 max-w-sm">
      <h3 className="font-semibold mb-2">Scan to support</h3>
      {imgUrl ? (
        <img src={imgUrl} alt="QR" className="w-40 h-40" />
      ) : (
        <p className="text-sm text-gray-500">QR will appear after you generate it in your dashboard.</p>
      )}
      <p className="text-xs mt-2 break-all">{url}</p>
    </div>
  );
}
