"use client";

import React, { useState, useRef, useEffect } from "react";
import * as xlsx from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileSpreadsheet, Loader2, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api, fetchUnits, type UnitRow, fetchItemSections, fetchItemDepartments, fetchItemCategories, type ItemSection, type ItemDepartment, type ItemCategory, fetchBrands, type BrandRow, fetchSuppliers, type SupplierRow, fetchLocations, type ServiceLocationRow } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ImportItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportItemsDialog({ open, onOpenChange, onSuccess }: ImportItemsDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [sections, setSections] = useState<ItemSection[]>([]);
  const [departments, setDepartments] = useState<ItemDepartment[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [locations, setLocations] = useState<ServiceLocationRow[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (open) {
      Promise.all([
        fetchUnits(""),
        fetchItemSections(),
        fetchItemDepartments(),
        fetchItemCategories(),
        fetchBrands(""),
        fetchSuppliers(""),
        fetchLocations()
      ]).then(([u, s, d, c, b, sp, l]) => {
        if (Array.isArray(u)) setUnits(u);
        if (Array.isArray(s)) setSections(s);
        if (Array.isArray(d)) setDepartments(d);
        if (Array.isArray(c)) setCategories(c);
        if (Array.isArray(b)) setBrands(b);
        if (Array.isArray(sp)) setSuppliers(sp);
        if (Array.isArray(l)) setLocations(l);
      }).catch(console.error);
    }
  }, [open]);

  const reset = () => {
    setFile(null);
    setParsedData([]);
    setErrorMsg("");
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const downloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Items");
      
      const columns = [
        "part_name", "price", "cost_price", "sku", "part_number", "barcode_number", 
        "unit", "brand_id", "supplier", "default_location", "section", "department", "category", "stock_quantity", "reorder_level", "is_active", 
        "is_fifo", "is_expiry", "item_type", "recipe_type", "wholesale_price", 
        "min_selling_price", "price_2", "net_weight_kg", "gross_weight_kg", 
        "units_per_carton", "packing_type", "hs_code", "carton_length_cm", 
        "carton_width_cm", "carton_height_cm", "volume_cbm", "carton_tare_weight_kg", 
        "is_online", "public_description"
      ];
      ws.addRow(columns);

      // Example rows
      ws.addRow(["Example Item A", 1500, 1000, "ITEM-A-01", "PN-1234", "123456789012", 
                 "", "", "", "", "", "", "", 50, 10, "Yes", "No", "No", "Part", "Standard", 1300, 1400, 1450, 
                 0.5, 0.6, 20, "Box", "1234.56.78", 30, 20, 15, 0.009, 0.1, 1, "A great example item"]);
      
      ws.addRow(["Example Service B", 500, 0, "SRV-B-02", "", "", 
                 "", "", "", "", "", "", "", 0, 0, "Yes", "No", "No", "Service", "Standard", 500, 500, 500, 
                 0, 0, 1, "", "", 0, 0, 0, 0, 0, 0, ""]);

      // Format header
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      });

      const listSheet = wb.addWorksheet('Lists', { state: 'hidden' });
      
      // Data validation for Units (Column G)
      const unitList = units.map(u => `${u.id} - ${u.name}`);
      if (unitList.length > 0) {
        unitList.forEach((u, i) => listSheet.getCell(`A${i + 1}`).value = u);
        const listRange = `Lists!$A$1:$A$${unitList.length}`;
        for (let i = 2; i <= 1000; i++) {
          ws.getCell(`G${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [listRange] };
        }
      }

      // Brand (Column H)
      const brandList = brands.map(b => `${b.id} - ${b.name}`);
      if (brandList.length > 0) {
        brandList.forEach((u, i) => listSheet.getCell(`B${i + 1}`).value = u);
        const listRange = `Lists!$B$1:$B$${brandList.length}`;
        for (let i = 2; i <= 1000; i++) {
          ws.getCell(`H${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [listRange] };
        }
      }

      // Supplier (Column I)
      const supplierList = suppliers.map(s => `${s.id} - ${s.name}`);
      if (supplierList.length > 0) {
        supplierList.forEach((u, i) => listSheet.getCell(`C${i + 1}`).value = u);
        const listRange = `Lists!$C$1:$C$${supplierList.length}`;
        for (let i = 2; i <= 1000; i++) {
          ws.getCell(`I${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [listRange] };
        }
      }

      // Default Location (Column J)
      const locationList = locations.map(l => `${l.id} - ${l.name}`);
      if (locationList.length > 0) {
        locationList.forEach((u, i) => listSheet.getCell(`D${i + 1}`).value = u);
        const listRange = `Lists!$D$1:$D$${locationList.length}`;
        for (let i = 2; i <= 1000; i++) {
          ws.getCell(`J${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [listRange] };
        }
      }

      // Section (Column K)
      const secList = sections.map(s => `${s.id} - ${s.name}`);
      if (secList.length > 0) {
        secList.forEach((u, i) => listSheet.getCell(`E${i + 1}`).value = u);
        const listRange = `Lists!$E$1:$E$${secList.length}`;
        for (let i = 2; i <= 1000; i++) {
          ws.getCell(`K${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [listRange] };
        }
      }

      // Department (Column L)
      const deptList = departments.map(d => `${d.id} - ${d.name}`);
      if (deptList.length > 0) {
        deptList.forEach((u, i) => listSheet.getCell(`F${i + 1}`).value = u);
        const listRange = `Lists!$F$1:$F$${deptList.length}`;
        for (let i = 2; i <= 1000; i++) {
          ws.getCell(`L${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [listRange] };
        }
      }

      // Category (Column M)
      const catList = categories.map(c => `${c.id} - ${c.name}`);
      if (catList.length > 0) {
        catList.forEach((u, i) => listSheet.getCell(`G${i + 1}`).value = u);
        const listRange = `Lists!$G$1:$G$${catList.length}`;
        for (let i = 2; i <= 1000; i++) {
          ws.getCell(`M${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [listRange] };
        }
      }

      // Boolean validations (is_active, is_fifo, is_expiry) - Columns P, Q, R
      for (let i = 2; i <= 1000; i++) {
        ws.getCell(`P${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Yes,No"'] };
        ws.getCell(`Q${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Yes,No"'] };
        ws.getCell(`R${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Yes,No"'] };
      }

      // Data validation for Item Type (Column S)
      for (let i = 2; i <= 1000; i++) {
        ws.getCell(`S${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Part,Service"'] };
      }

      // Data validation for Recipe Type (Column T)
      for (let i = 2; i <= 1000; i++) {
        ws.getCell(`T${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Standard,Recipe,Variable"'] };
      }

      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), "inventory_import_template.xlsx");
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to generate template", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setErrorMsg("");
    parseExcel(f);
  };

  const parseExcel = (f: File) => {
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = xlsx.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = xlsx.utils.sheet_to_json(worksheet);
        
        // Filter out completely empty rows that Excel sometimes includes
        const nonEmptyRows = json.filter((row: any) => {
          return Object.values(row).some(val => val !== undefined && val !== null && val !== '');
        });

        // Parse ID-Name formats and Booleans
        const mappedJson = nonEmptyRows.map((row: any) => {
          if (row.unit && typeof row.unit === 'string' && row.unit.includes(' - ')) {
            // Unit is saved as text name in DB, so we extract the name part
            row.unit = row.unit.split(' - ')[1].trim();
          }
          if (row.brand_id && typeof row.brand_id === 'string' && row.brand_id.includes(' - ')) {
            row.brand_id = parseInt(row.brand_id.split(' - ')[0]) || null;
          }
          if (row.supplier && typeof row.supplier === 'string' && row.supplier.includes(' - ')) {
            row.supplier_id = parseInt(row.supplier.split(' - ')[0]) || null;
          }
          if (row.default_location && typeof row.default_location === 'string' && row.default_location.includes(' - ')) {
            row.default_location_id = parseInt(row.default_location.split(' - ')[0]) || null;
          }
          if (row.section && typeof row.section === 'string' && row.section.includes(' - ')) {
            row.item_section_id = parseInt(row.section.split(' - ')[0]) || null;
          }
          if (row.department && typeof row.department === 'string' && row.department.includes(' - ')) {
            row.item_department_id = parseInt(row.department.split(' - ')[0]) || null;
          }
          if (row.category && typeof row.category === 'string' && row.category.includes(' - ')) {
            row.item_category_id = parseInt(row.category.split(' - ')[0]) || null;
          }
          if (row.is_active !== undefined) {
            row.is_active = String(row.is_active).toLowerCase() === 'yes' ? 1 : 0;
          }
          if (row.is_fifo !== undefined) {
            row.is_fifo = String(row.is_fifo).toLowerCase() === 'yes' ? 1 : 0;
          }
          if (row.is_expiry !== undefined) {
            row.is_expiry = String(row.is_expiry).toLowerCase() === 'yes' ? 1 : 0;
          }
          // Numeric validations and casting
          row.price = parseFloat(row.price) || 0;
          if (row.cost_price !== undefined) row.cost_price = parseFloat(row.cost_price) || 0;
          if (row.stock_quantity !== undefined) row.stock_quantity = parseFloat(row.stock_quantity) || 0;
          if (row.reorder_level !== undefined) row.reorder_level = parseFloat(row.reorder_level) || 0;
          if (row.wholesale_price !== undefined) row.wholesale_price = parseFloat(row.wholesale_price) || 0;
          if (row.min_selling_price !== undefined) row.min_selling_price = parseFloat(row.min_selling_price) || 0;
          if (row.price_2 !== undefined) row.price_2 = parseFloat(row.price_2) || 0;
          if (row.net_weight_kg !== undefined) row.net_weight_kg = parseFloat(row.net_weight_kg) || 0;
          if (row.gross_weight_kg !== undefined) row.gross_weight_kg = parseFloat(row.gross_weight_kg) || 0;
          if (row.units_per_carton !== undefined) row.units_per_carton = parseInt(row.units_per_carton) || 1;
          if (row.carton_length_cm !== undefined) row.carton_length_cm = parseFloat(row.carton_length_cm) || 0;
          if (row.carton_width_cm !== undefined) row.carton_width_cm = parseFloat(row.carton_width_cm) || 0;
          if (row.carton_height_cm !== undefined) row.carton_height_cm = parseFloat(row.carton_height_cm) || 0;
          if (row.volume_cbm !== undefined) row.volume_cbm = parseFloat(row.volume_cbm) || 0;
          if (row.carton_tare_weight_kg !== undefined) row.carton_tare_weight_kg = parseFloat(row.carton_tare_weight_kg) || 0;

          return row;
        });

        if (mappedJson.length === 0) {
          setErrorMsg("The uploaded file is empty.");
          setParsedData([]);
          setIsParsing(false);
          return;
        }

        // Validate required fields (strictly reject if any row fails)
        const invalidRows = mappedJson.filter((row: any) => !row.part_name || row.price <= 0);
        
        if (invalidRows.length > 0) {
          setErrorMsg(`Validation failed! Found ${invalidRows.length} invalid row(s). Please ensure every row has a 'part_name' and a valid 'price' greater than 0.`);
          setParsedData([]);
        } else {
          setParsedData(mappedJson);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to parse the Excel file. Please ensure it is a valid .xlsx file.");
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read the file.");
      setIsParsing(false);
    };
    reader.readAsBinaryString(f);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setIsImporting(true);
    setErrorMsg("");
    
    try {
      const res = await api('/api/part/import', {
        method: 'POST',
        body: JSON.stringify({ items: parsedData })
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        toast({ title: "Import Successful", description: `Successfully imported ${data.count} items.` });
        onSuccess();
        handleOpenChange(false);
      } else {
        throw new Error(data.message || "Import failed");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to import items");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import Inventory Items
          </DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx) file to bulk create new inventory items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center bg-muted/30 p-3 rounded-md border">
            <div className="text-sm">Need a template?</div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} disabled={isDownloading} className="gap-2">
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
              {isDownloading ? "Generating..." : "Template"}
            </Button>
          </div>

          <div 
            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${file ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileChange}
            />
            
            {file ? (
              <>
                <FileSpreadsheet className="w-10 h-10 text-primary mb-3" />
                <div className="font-semibold">{file.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />
                <div className="font-semibold">Click to upload Excel file</div>
                <div className="text-xs text-muted-foreground mt-1">.xlsx or .xls files only</div>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {parsedData.length > 0 && !errorMsg && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 p-2 rounded-md border border-green-200">
                <CheckCircle2 className="w-4 h-4" />
                Data validated! Ready to import {parsedData.length} item(s).
              </div>
              <div className="border rounded-md max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium truncate max-w-[200px]">{row.part_name}</TableCell>
                        <TableCell>{row.sku || '-'}</TableCell>
                        <TableCell>{row.price}</TableCell>
                        <TableCell>{row.stock_quantity || 0}</TableCell>
                        <TableCell>{row.item_type || 'Part'}</TableCell>
                      </TableRow>
                    ))}
                    {parsedData.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-2">
                          ... and {parsedData.length - 10} more rows
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={parsedData.length === 0 || isImporting || isParsing || !!errorMsg}
            className="gap-2"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {isImporting ? "Importing..." : "Import Items"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
