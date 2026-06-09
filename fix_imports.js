const fs = require('fs');

const files = [
  'c:/xampp/htdocs/rapair-management/front-end/src/app/cms/invoices/create/[orderId]/page.tsx',
  'c:/xampp/htdocs/rapair-management/front-end/src/app/cms/invoices/create/online/[id]/page.tsx',
  'c:/xampp/htdocs/rapair-management/front-end/src/app/cms/invoices/recurring/[id]/edit/page.tsx',
  'c:/xampp/htdocs/rapair-management/front-end/src/app/cms/invoices/recurring/new/page.tsx',
  'c:/xampp/htdocs/rapair-management/front-end/src/app/inventory/grn/new/page.tsx',
  'c:/xampp/htdocs/rapair-management/front-end/src/app/inventory/issue-notes/new/page.tsx',
  'c:/xampp/htdocs/rapair-management/front-end/src/app/inventory/stock-requests/new/page.tsx',
  'c:/xampp/htdocs/rapair-management/front-end/src/app/inventory/transfers/new/page.tsx',
  'c:/xampp/htdocs/rapair-management/front-end/src/components/inventory/PurchaseOrderForm.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // The user's output showed:
    // 27 │   type TaxRow,
    // 28 │ , formatPartLabel } from "@/lib/api";
    // We should replace \n, formatPartLabel } with \n  formatPartLabel }
    
    const newContent = content.replace(/\n,\s*formatPartLabel\s*}/g, '\n  formatPartLabel\n}')
                              .replace(/,\s*,\s*formatPartLabel\s*}/g, ', formatPartLabel }');

    if (newContent !== content) {
      content = newContent;
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, content);
      console.log('Fixed syntax error in', file);
    }
  }
}
