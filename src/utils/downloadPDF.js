const getToken = () => localStorage.getItem('sfda_token') || '';

/**
 * Downloads a PDF with auth token injected into the fetch request.
 */
export async function downloadPDF(reportId, filename = null) {
  const saveName = filename || `SFDA_Report_${reportId}.pdf`;
  try {
    const res = await fetch(`/api/reports/${reportId}/pdf/`, {
      headers: { 'Authorization': `Token ${getToken()}` },
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}: ${await res.text()}`);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = saveName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('PDF download error:', err);
    alert(`Could not download PDF: ${err.message}`);
  }
}

/**
 * Fetches an HTML preview with auth token, returns a blob: URL safe for iframe src.
 * Call revokePreviewUrl(url) when the modal closes.
 */
export async function fetchPreviewBlobUrl(reportId) {
  const res = await fetch(`/api/reports/${reportId}/preview/`, {
    headers: { 'Authorization': `Token ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Preview failed: ${res.status}`);
  const html = await res.text();
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
  return URL.createObjectURL(blob);
}

export function revokePreviewUrl(url) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}
