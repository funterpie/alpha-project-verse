import { useState, useEffect, useMemo } from 'react';
import { Plus, Download, Eye, Trash2, FileText, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReceiptData {
  id?: string;
  user_id?: string;
  receipt_number: string;
  client_name: string;
  company_name: string;
  description: string;
  quantity: number;
  price: number;
  amount: number;
  discount: number;
  notes: string;
  receipt_date: string;
  created_at?: string;
}

const emptyReceipt: ReceiptData = {
  receipt_number: '',
  client_name: '',
  company_name: '',
  description: '',
  quantity: 1,
  price: 0,
  amount: 0,
  discount: 0,
  notes: '',
  receipt_date: format(new Date(), 'yyyy-MM-dd'),
};

function generateReceiptNumber() {
  const prefix = 'RCT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${rand}`;
}

function generatePDF(r: ReceiptData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const primaryColor: [number, number, number] = [0, 180, 180];
  const darkColor: [number, number, number] = [30, 35, 50];
  const grayColor: [number, number, number] = [120, 130, 145];

  // Header band
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, w, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, 28);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Issued: ${format(new Date(r.receipt_date), 'dd/MM/yyyy')}`, w - 20, 20, { align: 'right' });
  doc.text(`#${r.receipt_number}`, w - 20, 28, { align: 'right' });

  // Bill To / From
  let y = 58;
  doc.setTextColor(...darkColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 20, y);
  doc.text('FROM:', w / 2 + 10, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  y += 7;
  doc.text(r.client_name || '—', 20, y);
  doc.text('Alpha Orbit', w / 2 + 10, y);
  y += 5;
  doc.text(r.company_name || '', 20, y);
  doc.text('DIGITAL AGENCY', w / 2 + 10, y);

  // Table
  y += 14;
  const subtotal = r.quantity * r.price;
  const total = subtotal - r.discount;

  autoTable(doc, {
    startY: y,
    head: [['DESCRIPTION', 'QTY', 'PRICE', 'AMOUNT']],
    body: [[r.description || '—', r.quantity.toString(), `$${r.price.toFixed(2)}`, `$${subtotal.toFixed(2)}`]],
    styles: { fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 248, 250] },
    margin: { left: 20, right: 20 },
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const summaryX = w - 80;

  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.text('Subtotal', summaryX, finalY);
  doc.text(`$${subtotal.toFixed(2)}`, w - 20, finalY, { align: 'right' });

  doc.text('Discount', summaryX, finalY + 7);
  doc.text(`-$${r.discount.toFixed(2)}`, w - 20, finalY + 7, { align: 'right' });

  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(summaryX, finalY + 11, w - 20, finalY + 11);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('TOTAL', summaryX, finalY + 19);
  doc.text(`$${total.toFixed(2)}`, w - 20, finalY + 19, { align: 'right' });

  // Notes
  if (r.notes) {
    const notesY = finalY + 32;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text('NOTES:', 20, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    const lines = doc.splitTextToSize(r.notes, w - 40);
    doc.text(lines, 20, notesY + 6);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFillColor(...primaryColor);
  doc.rect(0, footerY - 8, w, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you!', w / 2, footerY, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Alpha Orbit • alphaorbit.site', w / 2, footerY + 6, { align: 'center' });

  return doc;
}

export default function Receipts() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<ReceiptData | null>(null);
  const [form, setForm] = useState<ReceiptData>({ ...emptyReceipt });
  const [saving, setSaving] = useState(false);

  const computed = useMemo(() => {
    const subtotal = form.quantity * form.price;
    const total = subtotal - form.discount;
    return { subtotal, total };
  }, [form.quantity, form.price, form.discount]);

  async function fetchReceipts() {
    if (!user) return;
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load receipts'); return; }
    setReceipts(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchReceipts(); }, [user]);

  function openCreate() {
    setForm({ ...emptyReceipt, receipt_number: generateReceiptNumber(), receipt_date: format(new Date(), 'yyyy-MM-dd') });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!user) return;
    if (!form.client_name.trim()) { toast.error('Client name is required'); return; }
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    setSaving(true);
    const payload = {
      user_id: user.id,
      receipt_number: form.receipt_number || generateReceiptNumber(),
      client_name: form.client_name.trim(),
      company_name: form.company_name.trim(),
      description: form.description.trim(),
      quantity: form.quantity,
      price: form.price,
      amount: computed.total,
      discount: form.discount,
      notes: form.notes.trim(),
      receipt_date: form.receipt_date,
    };
    const { error } = await supabase.from('receipts').insert(payload);
    setSaving(false);
    if (error) { toast.error('Failed to save receipt: ' + error.message); return; }
    toast.success('Receipt created successfully');
    setFormOpen(false);
    fetchReceipts();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('receipts').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Receipt deleted');
    fetchReceipts();
  }

  function handleDownload(r: ReceiptData) {
    const doc = generatePDF(r);
    doc.save(`${r.receipt_number}.pdf`);
    toast.success('PDF downloaded');
  }

  function handlePreview(r: ReceiptData) {
    setPreviewReceipt(r);
    setPreviewOpen(true);
  }

  const update = (field: keyof ReceiptData, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Receipts</h1>
          <p className="text-muted-foreground text-sm">Generate and manage professional receipts</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Create Receipt</Button>
      </div>

      {/* Receipt History */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Receipt History</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading…</p>
          ) : receipts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No receipts yet. Create your first receipt!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.receipt_number}</TableCell>
                    <TableCell>{r.client_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.description}</TableCell>
                    <TableCell className="text-right font-semibold">${Number(r.amount).toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(r.receipt_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handlePreview(r)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(r)}><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(r.id!)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Receipt Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Receipt</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Receipt #</Label><Input value={form.receipt_number} onChange={e => update('receipt_number', e.target.value)} /></div>
                <div><Label>Date</Label><Input type="date" value={form.receipt_date} onChange={e => update('receipt_date', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Client Name *</Label><Input value={form.client_name} onChange={e => update('client_name', e.target.value)} placeholder="Client name" /></div>
                <div><Label>Company</Label><Input value={form.company_name} onChange={e => update('company_name', e.target.value)} placeholder="Company name" /></div>
              </div>
              <div><Label>Description *</Label><Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Service or product description" rows={3} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Quantity</Label><Input type="number" min={1} value={form.quantity} onChange={e => update('quantity', parseInt(e.target.value) || 1)} /></div>
                <div><Label>Price ($)</Label><Input type="number" min={0} step="0.01" value={form.price} onChange={e => update('price', parseFloat(e.target.value) || 0)} /></div>
                <div><Label>Discount ($)</Label><Input type="number" min={0} step="0.01" value={form.discount} onChange={e => update('discount', parseFloat(e.target.value) || 0)} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Optional notes" rows={2} /></div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Subtotal: <span className="font-semibold text-foreground">${computed.subtotal.toFixed(2)}</span>
                  {form.discount > 0 && <span className="ml-3">Discount: <span className="text-destructive">-${form.discount.toFixed(2)}</span></span>}
                </div>
                <div className="text-lg font-bold text-primary">Total: ${computed.total.toFixed(2)}</div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save Receipt'}</Button>
            </div>

            {/* Live Preview */}
            <div className="border border-border rounded-lg bg-background p-5 space-y-4 text-sm">
              <div className="bg-primary rounded-md p-4 text-primary-foreground">
                <div className="text-xl font-bold">INVOICE</div>
                <div className="text-xs mt-1 opacity-80">Issued: {form.receipt_date ? format(new Date(form.receipt_date), 'dd/MM/yyyy') : '—'}</div>
                <div className="text-xs opacity-80">#{form.receipt_number}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-bold text-foreground mb-1">BILL TO:</div>
                  <div className="text-muted-foreground">{form.client_name || '—'}</div>
                  <div className="text-muted-foreground">{form.company_name}</div>
                </div>
                <div>
                  <div className="font-bold text-foreground mb-1">FROM:</div>
                  <div className="text-muted-foreground">Alpha Orbit</div>
                  <div className="text-muted-foreground">DIGITAL AGENCY</div>
                </div>
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="p-2 text-left rounded-tl-md">Description</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right rounded-tr-md">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-2">{form.description || '—'}</td>
                    <td className="p-2 text-center">{form.quantity}</td>
                    <td className="p-2 text-right">${form.price.toFixed(2)}</td>
                    <td className="p-2 text-right font-semibold">${computed.subtotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex justify-end">
                <div className="space-y-1 text-xs w-40">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${computed.subtotal.toFixed(2)}</span></div>
                  {form.discount > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>-${form.discount.toFixed(2)}</span></div>}
                  <div className="flex justify-between font-bold text-foreground border-t border-primary pt-1 text-sm"><span>TOTAL</span><span>${computed.total.toFixed(2)}</span></div>
                </div>
              </div>
              {form.notes && <div className="text-xs text-muted-foreground border-t border-border pt-2"><span className="font-bold text-foreground">Notes: </span>{form.notes}</div>}
              <div className="bg-primary rounded-md p-3 text-center text-primary-foreground text-xs">
                <div className="font-bold">Thank you!</div>
                <div className="opacity-80">Alpha Orbit • alphaorbit.site</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Receipt Preview</DialogTitle></DialogHeader>
          {previewReceipt && (
            <div className="space-y-4 text-sm">
              <div className="bg-primary rounded-md p-4 text-primary-foreground">
                <div className="text-xl font-bold">INVOICE</div>
                <div className="text-xs mt-1 opacity-80">#{previewReceipt.receipt_number}</div>
                <div className="text-xs opacity-80">{format(new Date(previewReceipt.receipt_date), 'dd/MM/yyyy')}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><div className="font-bold mb-1">BILL TO:</div><div className="text-muted-foreground">{previewReceipt.client_name}</div><div className="text-muted-foreground">{previewReceipt.company_name}</div></div>
                <div><div className="font-bold mb-1">FROM:</div><div className="text-muted-foreground">Alpha Orbit</div></div>
              </div>
              <div className="border border-border rounded-md p-3">
                <div className="font-semibold mb-1">{previewReceipt.description}</div>
                <div className="text-muted-foreground">Qty: {previewReceipt.quantity} × ${Number(previewReceipt.price).toFixed(2)}</div>
              </div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">${Number(previewReceipt.amount).toFixed(2)}</span></div>
              {previewReceipt.notes && <div className="text-xs text-muted-foreground border-t border-border pt-2"><span className="font-bold text-foreground">Notes: </span>{previewReceipt.notes}</div>}
              <Button onClick={() => handleDownload(previewReceipt)} className="w-full"><Download className="mr-2 h-4 w-4" />Download PDF</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
