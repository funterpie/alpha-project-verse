import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, Download, Eye, Trash2, FileText, File } from 'lucide-react';
import jsPDF from 'jspdf';

// ── Template definitions ──────────────────────────────────────────────
const TEMPLATES = [
  { key: 'welcome_letter', label: 'Welcome / Onboarding Letter' },
  { key: 'access_request', label: 'Access Request Form' },
  { key: 'service_agreement', label: 'Service Agreement' },
  { key: 'meeting_summary', label: 'Meeting Summary' },
  { key: 'simple_contract', label: 'Simple Contract' },
] as const;

type TemplateKey = (typeof TEMPLATES)[number]['key'];

interface FieldDef { name: string; label: string; type: 'text' | 'textarea' | 'date'; required?: boolean }

const TEMPLATE_FIELDS: Record<TemplateKey, FieldDef[]> = {
  welcome_letter: [
    { name: 'recipient_name', label: 'Recipient Name', type: 'text', required: true },
    { name: 'position', label: 'Position / Role', type: 'text', required: true },
    { name: 'start_date', label: 'Start Date', type: 'date', required: true },
    { name: 'department', label: 'Department', type: 'text' },
    { name: 'manager_name', label: 'Manager Name', type: 'text' },
    { name: 'additional_notes', label: 'Additional Notes', type: 'textarea' },
  ],
  access_request: [
    { name: 'requester_name', label: 'Requester Name', type: 'text', required: true },
    { name: 'requester_email', label: 'Requester Email', type: 'text', required: true },
    { name: 'systems', label: 'Systems / Tools Requested', type: 'textarea', required: true },
    { name: 'justification', label: 'Business Justification', type: 'textarea', required: true },
    { name: 'access_level', label: 'Access Level (Read / Write / Admin)', type: 'text' },
    { name: 'request_date', label: 'Request Date', type: 'date' },
  ],
  service_agreement: [
    { name: 'client_name', label: 'Client Name', type: 'text', required: true },
    { name: 'client_company', label: 'Client Company', type: 'text' },
    { name: 'service_description', label: 'Service Description', type: 'textarea', required: true },
    { name: 'start_date', label: 'Start Date', type: 'date', required: true },
    { name: 'end_date', label: 'End Date', type: 'date' },
    { name: 'payment_terms', label: 'Payment Terms', type: 'textarea' },
    { name: 'total_amount', label: 'Total Amount ($)', type: 'text' },
  ],
  meeting_summary: [
    { name: 'meeting_title', label: 'Meeting Title', type: 'text', required: true },
    { name: 'meeting_date', label: 'Meeting Date', type: 'date', required: true },
    { name: 'attendees', label: 'Attendees', type: 'textarea', required: true },
    { name: 'agenda', label: 'Agenda', type: 'textarea' },
    { name: 'discussion', label: 'Discussion / Key Points', type: 'textarea', required: true },
    { name: 'action_items', label: 'Action Items', type: 'textarea' },
    { name: 'next_meeting', label: 'Next Meeting Date', type: 'date' },
  ],
  simple_contract: [
    { name: 'party_a', label: 'Party A (Your Company)', type: 'text', required: true },
    { name: 'party_b', label: 'Party B (Other Party)', type: 'text', required: true },
    { name: 'contract_title', label: 'Contract Title', type: 'text', required: true },
    { name: 'effective_date', label: 'Effective Date', type: 'date', required: true },
    { name: 'terms', label: 'Terms & Conditions', type: 'textarea', required: true },
    { name: 'compensation', label: 'Compensation / Payment', type: 'textarea' },
    { name: 'termination_clause', label: 'Termination Clause', type: 'textarea' },
  ],
};

// ── PDF generators ────────────────────────────────────────────────────
const PRIMARY: [number, number, number] = [0, 180, 180];
const DARK: [number, number, number] = [30, 35, 50];
const GRAY: [number, number, number] = [120, 130, 145];

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, w, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 24);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, w - 20, 24, { align: 'right' });
}

function addFooter(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...PRIMARY);
  doc.rect(0, h - 20, w, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Alpha Orbit • alphaorbit.site', w / 2, h - 8, { align: 'center' });
}

function addField(doc: jsPDF, label: string, value: string, y: number, w: number): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(label.toUpperCase(), 20, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  const lines = doc.splitTextToSize(value || '—', w - 40);
  doc.text(lines, 20, y + 6);
  return y + 6 + lines.length * 4.5 + 4;
}

function generateDocPDF(template: TemplateKey, data: Record<string, string>, title: string): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const templateLabel = TEMPLATES.find(t => t.key === template)?.label || template;

  addHeader(doc, templateLabel, format(new Date(), 'dd/MM/yyyy'));

  let y = 50;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(title, 20, y);
  y += 10;

  // Draw a separator
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(20, y, w - 20, y);
  y += 8;

  const fields = TEMPLATE_FIELDS[template];
  for (const field of fields) {
    const val = data[field.name] || '';
    if (!val) continue;
    // Check if we need a new page
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    y = addField(doc, field.label, val, y, w);
  }

  addFooter(doc);
  return doc;
}

// ── Component ─────────────────────────────────────────────────────────
interface DocRow {
  id: string;
  user_id: string;
  template_type: string;
  title: string;
  form_data: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export default function Documents() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocRow | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('welcome_letter');
  const [formTitle, setFormTitle] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function fetchDocs() {
    if (!user) return;
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load documents'); return; }
    setDocs((data as unknown as DocRow[]) || []);
    setLoading(false);
  }

  useEffect(() => { fetchDocs(); }, [user]);

  function openCreate() {
    setSelectedTemplate('welcome_letter');
    setFormTitle('');
    setFormData({});
    setFormOpen(true);
  }

  function openEdit(d: DocRow) {
    setSelectedTemplate(d.template_type as TemplateKey);
    setFormTitle(d.title);
    setFormData(d.form_data);
    setPreviewDoc(d);
    setFormOpen(true);
  }

  async function handleSave() {
    if (!user) return;
    if (!formTitle.trim()) { toast.error('Document title is required'); return; }
    setSaving(true);

    const payload = {
      user_id: user.id,
      template_type: selectedTemplate,
      title: formTitle.trim(),
      form_data: formData,
    };

    let error;
    if (previewDoc && formOpen) {
      // Update existing
      ({ error } = await supabase.from('documents').update(payload).eq('id', previewDoc.id));
    } else {
      ({ error } = await supabase.from('documents').insert(payload));
    }

    setSaving(false);
    if (error) { toast.error('Failed to save: ' + error.message); return; }
    toast.success(previewDoc ? 'Document updated' : 'Document created');
    setFormOpen(false);
    setPreviewDoc(null);
    fetchDocs();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Document deleted');
    fetchDocs();
  }

  function handleDownload(d: DocRow) {
    const doc = generateDocPDF(d.template_type as TemplateKey, d.form_data, d.title);
    doc.save(`${d.title.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF downloaded');
  }

  function handlePreview(d: DocRow) {
    setPreviewDoc(d);
    setPreviewOpen(true);
  }

  const fields = TEMPLATE_FIELDS[selectedTemplate];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground text-sm">Generate professional business documents from templates</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Document</Button>
      </div>

      {/* Document History */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Document History</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading…</p>
          ) : docs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No documents yet. Create your first document!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {TEMPLATES.find(t => t.key === d.template_type)?.label || d.template_type}
                      </span>
                    </TableCell>
                    <TableCell>{format(new Date(d.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handlePreview(d)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(d)}><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><FileText className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Document Dialog */}
      <Dialog open={formOpen} onOpenChange={v => { setFormOpen(v); if (!v) setPreviewDoc(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{previewDoc ? 'Edit' : 'Create'} Document</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label>Template</Label>
                <Select value={selectedTemplate} onValueChange={v => { setSelectedTemplate(v as TemplateKey); setFormData({}); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Document Title *</Label>
                <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Welcome Letter - John Doe" />
              </div>

              {fields.map(f => (
                <div key={f.name}>
                  <Label>{f.label}{f.required ? ' *' : ''}</Label>
                  {f.type === 'textarea' ? (
                    <Textarea value={formData[f.name] || ''} onChange={e => setFormData({ ...formData, [f.name]: e.target.value })} rows={3} />
                  ) : (
                    <Input type={f.type} value={formData[f.name] || ''} onChange={e => setFormData({ ...formData, [f.name]: e.target.value })} />
                  )}
                </div>
              ))}

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Saving…' : previewDoc ? 'Update Document' : 'Save Document'}
              </Button>
            </div>

            {/* Live Preview */}
            <div className="border border-border rounded-lg bg-background p-5 space-y-4 text-sm">
              <div className="bg-primary rounded-md p-4 text-primary-foreground">
                <div className="text-lg font-bold">{TEMPLATES.find(t => t.key === selectedTemplate)?.label}</div>
                <div className="text-xs mt-1 opacity-80">{format(new Date(), 'dd/MM/yyyy')}</div>
              </div>
              <div className="font-semibold text-foreground">{formTitle || 'Untitled Document'}</div>
              <div className="border-t border-primary pt-3 space-y-3">
                {fields.map(f => {
                  const val = formData[f.name];
                  if (!val) return null;
                  return (
                    <div key={f.name}>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">{f.label}</div>
                      <div className="text-xs text-foreground whitespace-pre-wrap">{val}</div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-primary rounded-md p-3 text-center text-primary-foreground text-xs">
                <div className="font-bold">Alpha Orbit</div>
                <div className="opacity-80">alphaorbit.site</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Document Preview</DialogTitle></DialogHeader>
          {previewDoc && (
            <div className="space-y-4 text-sm">
              <div className="bg-primary rounded-md p-4 text-primary-foreground">
                <div className="text-lg font-bold">{TEMPLATES.find(t => t.key === previewDoc.template_type)?.label}</div>
                <div className="text-xs mt-1 opacity-80">{format(new Date(previewDoc.created_at), 'dd/MM/yyyy')}</div>
              </div>
              <div className="font-semibold text-foreground">{previewDoc.title}</div>
              <div className="border-t border-border pt-3 space-y-3">
                {TEMPLATE_FIELDS[previewDoc.template_type as TemplateKey]?.map(f => {
                  const val = previewDoc.form_data[f.name];
                  if (!val) return null;
                  return (
                    <div key={f.name}>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">{f.label}</div>
                      <div className="text-xs text-foreground whitespace-pre-wrap">{val}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleDownload(previewDoc)} className="flex-1"><Download className="mr-2 h-4 w-4" />Download PDF</Button>
                <Button variant="outline" onClick={() => { setPreviewOpen(false); openEdit(previewDoc); }}>Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
