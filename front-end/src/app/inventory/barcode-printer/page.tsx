"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { fetchParts, type PartRow } from "@/lib/api";
import Barcode128 from "@/components/inventory/Barcode128";
import { Printer, Search, Plus, Trash2, LayoutGrid, RotateCcw, AlertTriangle, Layers, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrintableItem {
  part: PartRow;
  qty: number;
}

export default function BarcodePrinterPage() {
  const { toast } = useToast();
  
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PartRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState<PrintableItem[]>([]);

  // List View Mode states
  const [viewMode, setViewMode] = useState<"queue" | "list">("queue");
  const [allParts, setAllParts] = useState<PartRow[]>([]);
  const [loadingAllParts, setLoadingAllParts] = useState(false);
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [listPrintQuantities, setListPrintQuantities] = useState<Record<number, number>>({});

  // Settings Layout Mode: 'roll' (Thermal Roll) or 'grid' (A4 Sheet Grid)
  const [layoutMode, setLayoutMode] = useState<"roll" | "grid">("roll");

  // General Settings
  const [showItemName, setShowItemName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showCode, setShowCode] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("LKR");
  const [customHeader, setCustomHeader] = useState("");

  // Dimension Settings (Thermal Roll)
  const [rollPreset, setRollPreset] = useState("50x30");
  const [labelWidth, setLabelWidth] = useState(50); // in mm
  const [labelHeight, setLabelHeight] = useState(30); // in mm
  const [labelPadding, setLabelPadding] = useState(3); // in mm

  // Dimension Settings (Grid)
  const [gridPreset, setGridPreset] = useState("24");
  const [gridColumns, setGridColumns] = useState(3);
  const [gridRows, setGridRows] = useState(8);
  const [gridGap, setGridGap] = useState(2); // in mm
  const [gridMarginTop, setGridMarginTop] = useState(10); // in mm
  const [gridMarginLeft, setGridMarginLeft] = useState(10); // in mm

  // Barcode Render Settings
  const [barcodeHeight, setBarcodeHeight] = useState(40); // in pixels
  const [barcodeWidthScale, setBarcodeWidthScale] = useState(1); // thin bar width
  const [fontSize, setFontSize] = useState(11); // in px

  // Search items as typing
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetchParts(searchQuery);
        setSearchResults(Array.isArray(res) ? res : []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  useEffect(() => {
    if (layoutMode === "roll") {
      if (rollPreset === "50x30") {
        setLabelWidth(50);
        setLabelHeight(30);
        setLabelPadding(3);
      } else if (rollPreset === "38x25") {
        setLabelWidth(38);
        setLabelHeight(25);
        setLabelPadding(2);
      } else if (rollPreset === "80x50") {
        setLabelWidth(80);
        setLabelHeight(50);
        setLabelPadding(5);
      } else if (rollPreset === "1x1") {
        setLabelWidth(25.4);
        setLabelHeight(25.4);
        setLabelPadding(1.5);
        setBarcodeHeight(25);
      } else if (rollPreset === "2x1") {
        setLabelWidth(50.8);
        setLabelHeight(25.4);
        setLabelPadding(2);
        setBarcodeHeight(30);
      } else if (rollPreset === "1.5x1") {
        setLabelWidth(38.1);
        setLabelHeight(25.4);
        setLabelPadding(2);
        setBarcodeHeight(30);
      }
    }
  }, [rollPreset, layoutMode]);

  useEffect(() => {
    if (layoutMode === "grid") {
      if (gridPreset === "24") {
        setGridColumns(3);
        setGridRows(8);
        setGridGap(2.5);
        setGridMarginTop(12);
        setGridMarginLeft(12);
      } else if (gridPreset === "40") {
        setGridColumns(4);
        setGridRows(10);
        setGridGap(1.5);
        setGridMarginTop(8);
        setGridMarginLeft(8);
      }
    }
  }, [gridPreset, layoutMode]);

  // Actions
  const handleAddItem = (part: PartRow) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.part.id === part.id);
      if (existing) {
        return prev.map((item) =>
          item.part.id === part.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { part, qty: 1 }];
    });
    toast({
      title: "Item Added",
      description: `${part.part_name} added to printer queue.`,
    });
  };

  const handleRemoveItem = (id: number) => {
    setSelectedItems((prev) => prev.filter((item) => item.part.id !== id));
  };

  const handleUpdateQty = (id: number, qty: number) => {
    if (qty < 1) return;
    setSelectedItems((prev) =>
      prev.map((item) => (item.part.id === id ? { ...item, qty } : item))
    );
  };

  const handleFillFromStock = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Queue Empty",
        description: "Add items to the queue first.",
        variant: "destructive",
      });
      return;
    }
    setSelectedItems((prev) =>
      prev.map((item) => ({
        ...item,
        qty: Math.max(1, Math.round(item.part.stock_quantity || 0)),
      }))
    );
    toast({
      title: "Quantities Filled",
      description: "Filled quantities matching stock levels.",
    });
  };

  const handleClearQueue = () => {
    setSelectedItems([]);
  };

  const getListQty = (partId: number) => listPrintQuantities[partId] || 1;
  const setListQty = (partId: number, val: number) => {
    setListPrintQuantities(prev => ({ ...prev, [partId]: Math.max(1, val) }));
  };

  const handleListFillFromStock = () => {
    const nextPrintQuantities: Record<number, number> = {};
    allParts.forEach((part) => {
      nextPrintQuantities[part.id] = Math.max(1, Math.round(part.stock_quantity || 0));
    });
    setListPrintQuantities(nextPrintQuantities);
    toast({
      title: "Quantities set",
      description: "Set all print quantities to match stock levels.",
    });
  };

  useEffect(() => {
    if (viewMode === "list" && allParts.length === 0) {
      void (async () => {
        setLoadingAllParts(true);
        try {
          const res = await fetchParts("");
          setAllParts(Array.isArray(res) ? res : []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingAllParts(false);
        }
      })();
    }
  }, [viewMode, allParts.length]);

  const filteredAllParts = allParts.filter((part) => {
    const q = listSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (part.part_name || "").toLowerCase().includes(q) ||
      (part.sku || "").toLowerCase().includes(q) ||
      (part.barcode_number || "").toLowerCase().includes(q) ||
      (part.part_number || "").toLowerCase().includes(q)
    );
  });

  const handleTriggerDirectPrint = (part: PartRow, qty: number) => {
    if (qty < 1) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups to print barcodes in a new tab.",
        variant: "destructive",
      });
      return;
    }

    const labelsArray = Array(qty).fill(part);

    let itemsHtml = "";
    if (layoutMode === "roll") {
      itemsHtml = `
        <div style="width: 100%; display: flex; flex-direction: column; items-center;">
          ${labelsArray.map((part) => {
            const barcodeVal = part.barcode_number || part.sku || `ITEM-${part.id}`;
            const svgMarkup = renderBarcodeSvgString(barcodeVal, barcodeWidthScale, barcodeHeight, showCode);
            return `
              <div class="print-label" style="
                width: ${labelWidth}mm;
                height: ${labelHeight}mm;
                padding: ${labelPadding}mm;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                text-align: center;
                overflow: hidden;
                background: white;
                color: black;
              ">
                ${customHeader ? `<div style="height: 10%; display: flex; align-items: center; justify-content: center; font-size: ${fontSize - 2}pt; font-weight: bold; text-transform: uppercase; line-height: 1; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${customHeader}</div>` : ''}
                ${showItemName ? `<div style="height: 20%; display: flex; align-items: center; justify-content: center; font-size: ${fontSize - 1}pt; font-weight: bold; line-height: 1.1; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 1px 0;">${part.part_name}</div>` : ''}
                <div style="height: 52%; width: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; margin: 1px 0;">
                  ${svgMarkup}
                </div>
                ${showPrice ? `<div style="height: 18%; display: flex; align-items: center; justify-content: center; font-size: ${fontSize}pt; font-weight: 900; line-height: 1; letter-spacing: 0.02em;">${currencySymbol} ${Number(part.price || 0).toFixed(2)}</div>` : ''}
              </div>
            `;
          }).join("")}
        </div>
      `;
    } else {
      itemsHtml = `
        <div style="
          padding-top: ${gridMarginTop}mm;
          padding-left: ${gridMarginLeft}mm;
          padding-right: ${gridMarginLeft}mm;
          box-sizing: border-box;
          width: 100%;
        ">
          <div style="
            display: grid;
            grid-template-columns: repeat(${gridColumns}, 1fr);
            gap: ${gridGap}mm;
            width: 100%;
          ">
            ${labelsArray.map((part) => {
              const barcodeVal = part.barcode_number || part.sku || `ITEM-${part.id}`;
              const svgMarkup = renderBarcodeSvgString(barcodeVal, barcodeWidthScale, barcodeHeight, showCode);
              return `
                <div style="
                  padding: 3mm;
                  box-sizing: border-box;
                  min-height: 35mm;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  align-items: center;
                  text-align: center;
                  overflow: hidden;
                  border: 1px solid #ddd;
                  background: white;
                  color: black;
                ">
                  ${customHeader ? `<div style="font-size: ${fontSize - 2}pt; font-weight: bold; text-transform: uppercase; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${customHeader}</div>` : ''}
                  ${showItemName ? `<div style="font-size: ${fontSize - 1}pt; font-weight: bold; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${part.part_name}</div>` : ''}
                  <div style="width: 100%; display: flex; justify-content: center; margin: 4px 0;">${svgMarkup}</div>
                  ${showPrice ? `<div style="font-size: ${fontSize}pt; font-weight: 900;">${currencySymbol} ${Number(part.price || 0).toFixed(2)}</div>` : ''}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            html, body {
              background: #fff !important;
              color: #000 !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: 100% !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
            }
            @page {
              margin: 0 !important;
              ${layoutMode === "roll" 
                ? `size: ${labelWidth}mm ${labelHeight}mm !important;` 
                : `size: A4 portrait !important;`
              }
            }
            .print-label {
              page-break-after: always !important;
              break-after: page !important;
            }
          </style>
        </head>
        <body>
          ${itemsHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleTriggerPrint = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Nothing to print",
        description: "Please add items to print queue first.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups to print barcodes in a new tab.",
        variant: "destructive",
      });
      return;
    }

    // Generate HTML for each sticker
    let itemsHtml = "";
    if (layoutMode === "roll") {
      itemsHtml = `
        <div style="width: 100%; display: flex; flex-direction: column; items-center;">
          ${flattenedLabels.map((part) => {
            const barcodeVal = part.barcode_number || part.sku || `ITEM-${part.id}`;
            const svgMarkup = renderBarcodeSvgString(barcodeVal, barcodeWidthScale, barcodeHeight, showCode);
            return `
              <div class="print-label" style="
                width: ${labelWidth}mm;
                height: ${labelHeight}mm;
                padding: ${labelPadding}mm;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                text-align: center;
                overflow: hidden;
                background: white;
                color: black;
              ">
                ${customHeader ? `<div style="height: 10%; display: flex; align-items: center; justify-content: center; font-size: ${fontSize - 2}pt; font-weight: bold; text-transform: uppercase; line-height: 1; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${customHeader}</div>` : ''}
                ${showItemName ? `<div style="height: 20%; display: flex; align-items: center; justify-content: center; font-size: ${fontSize - 1}pt; font-weight: bold; line-height: 1.1; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 1px 0;">${part.part_name}</div>` : ''}
                <div style="height: 52%; width: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; margin: 1px 0;">
                  ${svgMarkup}
                </div>
                ${showPrice ? `<div style="height: 18%; display: flex; align-items: center; justify-content: center; font-size: ${fontSize}pt; font-weight: 900; line-height: 1; letter-spacing: 0.02em;">${currencySymbol} ${Number(part.price || 0).toFixed(2)}</div>` : ''}
              </div>
            `;
          }).join("")}
        </div>
      `;
    } else {
      itemsHtml = `
        <div style="
          padding-top: ${gridMarginTop}mm;
          padding-left: ${gridMarginLeft}mm;
          padding-right: ${gridMarginLeft}mm;
          box-sizing: border-box;
          width: 100%;
        ">
          <div style="
            display: grid;
            grid-template-columns: repeat(${gridColumns}, 1fr);
            gap: ${gridGap}mm;
            width: 100%;
          ">
            ${flattenedLabels.map((part) => {
              const barcodeVal = part.barcode_number || part.sku || `ITEM-${part.id}`;
              const svgMarkup = renderBarcodeSvgString(barcodeVal, barcodeWidthScale, barcodeHeight, showCode);
              return `
                <div style="
                  padding: 3mm;
                  box-sizing: border-box;
                  min-height: 35mm;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  align-items: center;
                  text-align: center;
                  overflow: hidden;
                  border: 1px solid #ddd;
                  background: white;
                  color: black;
                ">
                  ${customHeader ? `<div style="font-size: ${fontSize - 2}pt; font-weight: bold; text-transform: uppercase; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${customHeader}</div>` : ''}
                  ${showItemName ? `<div style="font-size: ${fontSize - 1}pt; font-weight: bold; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${part.part_name}</div>` : ''}
                  <div style="width: 100%; display: flex; justify-content: center; margin: 4px 0;">${svgMarkup}</div>
                  ${showPrice ? `<div style="font-size: ${fontSize}pt; font-weight: 900;">${currencySymbol} ${Number(part.price || 0).toFixed(2)}</div>` : ''}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }

    // Write contents to the new print tab
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            html, body {
              background: #fff !important;
              color: #000 !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: 100% !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
            }
            @page {
              margin: 0 !important;
              ${layoutMode === "roll" 
                ? `size: ${labelWidth}mm ${labelHeight}mm !important;` 
                : `size: A4 portrait !important;`
              }
            }
            .print-label {
              page-break-after: always !important;
              break-after: page !important;
            }
          </style>
        </head>
        <body>
          ${itemsHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Generate flattened array of labels to render in preview/print
  const flattenedLabels = selectedItems.flatMap((item) =>
    Array(item.qty).fill(item.part)
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full pb-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 text-foreground">
              <Printer className="w-8 h-8 text-primary" />
              Barcode Printer Module
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure layout presets, manage item quantities, and print Code 128 thermal rolls or sheets.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border self-start sm:self-center shadow-sm">
            <Button
              variant={viewMode === "queue" ? "default" : "ghost"}
              className="text-xs h-9 px-3 rounded-lg"
              onClick={() => setViewMode("queue")}
            >
              <Layers className="w-4 h-4 mr-1.5" /> Design Queue
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              className="text-xs h-9 px-3 rounded-lg"
              onClick={() => setViewMode("list")}
            >
              <LayoutGrid className="w-4 h-4 mr-1.5" /> Inventory List Mode
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 print:hidden">
          
          {/* LEFT PANEL: Queue or List View */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            
            {viewMode === "queue" ? (
              <>
                {/* SEARCH PRODUCTS CARD */}
                <Card className="border-none shadow-md overflow-hidden bg-card/60 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="w-5 h-5 text-muted-foreground" />
                      Select Products from Inventory
                    </CardTitle>
                    <CardDescription>Search by name, SKU, barcode or part number</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search product name, SKU..."
                        className="pl-9 h-11"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {searching && (
                      <div className="text-sm text-center py-4 text-muted-foreground">Searching parts database...</div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="border rounded-md overflow-hidden bg-background divide-y max-h-[300px] overflow-y-auto">
                        {searchResults.map((part) => (
                          <div
                            key={part.id}
                            className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0 pr-3">
                              <p className="font-semibold text-sm truncate">{part.part_name}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <span className="truncate">SKU: <span className="font-mono">{part.sku || "N/A"}</span></span>
                                <span>Stock: <span className="font-bold text-emerald-600">{part.stock_quantity ?? 0}</span></span>
                                <span>Price: <span className="font-semibold text-primary">{currencySymbol} {Number(part.price || 0).toFixed(2)}</span></span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="gap-1 h-8 px-2 bg-primary/90 hover:bg-primary"
                              onClick={() => handleAddItem(part)}
                            >
                              <Plus className="w-4 h-4" /> Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchQuery.trim().length >= 2 && searchResults.length === 0 && !searching && (
                      <div className="text-sm text-center py-4 text-muted-foreground italic border border-dashed rounded-md bg-muted/20">
                        No matching parts found in active inventory.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* PRINT QUEUE CARD */}
                <Card className="border-none shadow-md overflow-hidden bg-card/60 backdrop-blur-sm flex-1">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg">Print Queue</CardTitle>
                      <CardDescription>Specify print quantity per product</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 border-muted-foreground/20"
                        onClick={handleFillFromStock}
                        disabled={selectedItems.length === 0}
                      >
                        <Layers className="w-3.5 h-3.5" /> Fill from Stock
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                        onClick={handleClearQueue}
                        disabled={selectedItems.length === 0}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear Queue
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {selectedItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-14 px-4 text-center text-muted-foreground">
                        <Printer className="w-12 h-12 stroke-[1.2] mb-3 text-muted-foreground/60" />
                        <p className="font-medium text-sm">Print queue is empty</p>
                        <p className="text-xs text-muted-foreground/70 max-w-xs mt-1">
                          Search and select items above to start designing and printing labels.
                        </p>
                      </div>
                    ) : (
                      <div className="border-t divide-y max-h-[450px] overflow-y-auto">
                        {selectedItems.map((item) => (
                          <div
                            key={item.part.id}
                            className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="font-medium text-sm text-foreground truncate">{item.part.part_name}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 font-mono">
                                <span>SKU: {item.part.sku || "N/A"}</span>
                                <span>Barcode: {item.part.barcode_number || item.part.sku || "N/A"}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Label htmlFor={`qty-${item.part.id}`} className="sr-only">Qty</Label>
                                <span className="text-xs text-muted-foreground mr-1">Labels:</span>
                                <Input
                                  id={`qty-${item.part.id}`}
                                  type="number"
                                  min={1}
                                  className="w-16 h-8 text-center"
                                  value={item.qty}
                                  onChange={(e) => handleUpdateQty(item.part.id, parseInt(e.target.value) || 1)}
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveItem(item.part.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              /* INVENTORY LIST MODE CARD */
              <Card className="border-none shadow-md overflow-hidden bg-card/60 backdrop-blur-sm flex-1 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">Active Inventory Items</CardTitle>
                      <CardDescription>Directly print stickers or add them to the queue</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-9 gap-1 border-muted-foreground/20 self-start sm:self-auto"
                        onClick={handleListFillFromStock}
                        disabled={allParts.length === 0}
                      >
                        <Layers className="w-3.5 h-3.5" /> Set Qty to Stock
                      </Button>
                      <div className="relative w-full sm:w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Filter list..."
                          className="pl-8 h-9 text-xs"
                          value={listSearchQuery}
                          onChange={(e) => setListSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto flex-1 max-h-[600px] overflow-y-auto">
                  {loadingAllParts ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                      <span className="text-sm font-medium">Loading inventory items...</span>
                    </div>
                  ) : filteredAllParts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <Printer className="w-12 h-12 stroke-[1.2] mb-2 text-muted-foreground/55" />
                      <p className="font-semibold text-sm">No items found</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-muted/40 uppercase tracking-wider font-bold text-muted-foreground border-b text-[10px]">
                        <tr>
                          <th className="p-3">Product Info</th>
                          <th className="p-3 text-center">Stock</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-center w-20">Print Qty</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredAllParts.map((part) => (
                          <tr key={part.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3 max-w-[200px] sm:max-w-[260px] truncate">
                              <p className="font-semibold text-sm truncate text-foreground">{part.part_name}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground mt-1 font-mono">
                                {part.sku && <span>SKU: {part.sku}</span>}
                                {part.barcode_number && <span>BC: {part.barcode_number}</span>}
                                {part.part_number && <span>PN: {part.part_number}</span>}
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] ${
                                (part.stock_quantity ?? 0) > 0 
                                  ? "bg-emerald-500/10 text-emerald-600" 
                                  : "bg-destructive/10 text-destructive"
                              }`}>
                                {part.stock_quantity ?? 0}
                              </span>
                            </td>
                            <td className="p-3 text-right font-medium text-primary">
                              {currencySymbol} {Number(part.price || 0).toFixed(2)}
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min={1}
                                className="w-14 h-8 text-center bg-background px-1"
                                value={getListQty(part.id)}
                                onChange={(e) => setListQty(part.id, parseInt(e.target.value) || 1)}
                              />
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 text-xs gap-1"
                                  onClick={() => {
                                    handleAddItem(part);
                                    // Set queue quantity to match list quantity
                                    setSelectedItems(prev => prev.map(item => item.part.id === part.id ? { ...item, qty: getListQty(part.id) } : item));
                                  }}
                                >
                                  <Plus className="w-3.5 h-3.5" /> Queue
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 px-2 text-xs gap-1 bg-primary"
                                  onClick={() => handleTriggerDirectPrint(part, getListQty(part.id))}
                                >
                                  <Printer className="w-3.5 h-3.5" /> Print
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            )}

          </div>

          {/* RIGHT PANEL: Settings Customizer */}
          <div className="xl:col-span-5 flex flex-col gap-6">
            
            {/* PRINTER SETTINGS CARD */}
            <Card className="border-none shadow-md overflow-hidden bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg">Layout & Print Customization</CardTitle>
                <CardDescription>Configure printer size, display components, and density</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-5">
                
                {/* 1. Layout Mode Switch */}
                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold">Printer Type Layout</Label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted/40 border">
                    <button
                      type="button"
                      className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        layoutMode === "roll"
                          ? "bg-background shadow text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setLayoutMode("roll")}
                    >
                      <RotateCcw className="w-3.5 h-3.5 rotate-90" /> Thermal Roll (Continuous)
                    </button>
                    <button
                      type="button"
                      className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        layoutMode === "grid"
                          ? "bg-background shadow text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setLayoutMode("grid")}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" /> A4 Sheet Grid
                    </button>
                  </div>
                </div>

                {/* 2. Layout Size Selection */}
                {layoutMode === "roll" ? (
                  <div className="space-y-4 border p-4.5 rounded-lg bg-muted/20">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Thermal Sticker Roll Presets</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Size Preset</Label>
                        <Select value={rollPreset} onValueChange={setRollPreset}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50x30">50mm × 30mm (Standard)</SelectItem>
                            <SelectItem value="38x25">38mm × 25mm (Jewelry/Cable)</SelectItem>
                            <SelectItem value="80x50">80mm × 50mm (Large Tag)</SelectItem>
                            <SelectItem value="2x1">2" × 1" (50.8mm × 25.4mm)</SelectItem>
                            <SelectItem value="1.5x1">1.5" × 1" (38.1mm × 25.4mm)</SelectItem>
                            <SelectItem value="1x1">1" × 1" (25.4mm × 25.4mm)</SelectItem>
                            <SelectItem value="custom">Custom Dimensions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Label Margins/Padding (mm)</Label>
                        <Input
                          type="number"
                          value={labelPadding}
                          className="h-9"
                          onChange={(e) => {
                            setRollPreset("custom");
                            setLabelPadding(parseFloat(e.target.value) || 0);
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-2">
                        <Label>Sticker Width (mm)</Label>
                        <Input
                          type="number"
                          value={labelWidth}
                          className="h-9"
                          onChange={(e) => {
                            setRollPreset("custom");
                            setLabelWidth(parseFloat(e.target.value) || 10);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sticker Height (mm)</Label>
                        <Input
                          type="number"
                          value={labelHeight}
                          className="h-9"
                          onChange={(e) => {
                            setRollPreset("custom");
                            setLabelHeight(parseFloat(e.target.value) || 10);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 border p-4.5 rounded-lg bg-muted/20">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">A Avery-style Sheet Options</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Layout Preset</Label>
                        <Select value={gridPreset} onValueChange={setGridPreset}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="24">A4 24 labels (3x8 grid)</SelectItem>
                            <SelectItem value="40">A4 40 labels (4x10 grid)</SelectItem>
                            <SelectItem value="custom">Custom Grid Settings</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Columns</Label>
                        <Input
                          type="number"
                          value={gridColumns}
                          className="h-9"
                          onChange={(e) => {
                            setGridPreset("custom");
                            setGridColumns(parseInt(e.target.value) || 1);
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="space-y-2">
                        <Label>Rows</Label>
                        <Input
                          type="number"
                          value={gridRows}
                          className="h-9"
                          onChange={(e) => {
                            setGridPreset("custom");
                            setGridRows(parseInt(e.target.value) || 1);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gap (mm)</Label>
                        <Input
                          type="number"
                          value={gridGap}
                          className="h-9"
                          onChange={(e) => {
                            setGridPreset("custom");
                            setGridGap(parseFloat(e.target.value) || 0);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Top Margin (mm)</Label>
                        <Input
                          type="number"
                          value={gridMarginTop}
                          className="h-9"
                          onChange={(e) => {
                            setGridPreset("custom");
                            setGridMarginTop(parseFloat(e.target.value) || 0);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Barcode Customizer Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold border-b pb-1">Visual Options</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-name" className="text-xs cursor-pointer select-none">Show Item Name</Label>
                      <Switch id="show-name" checked={showItemName} onCheckedChange={setShowItemName} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-price" className="text-xs cursor-pointer select-none">Show Selling Price</Label>
                      <Switch id="show-price" checked={showPrice} onCheckedChange={setShowPrice} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-code" className="text-xs cursor-pointer select-none">Show Barcode Value</Label>
                      <Switch id="show-code" checked={showCode} onCheckedChange={setShowCode} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Custom Header (Company/Shop)</Label>
                      <Input
                        placeholder="e.g. Payshia Software"
                        value={customHeader}
                        className="h-9 text-xs"
                        onChange={(e) => setCustomHeader(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Currency Symbol</Label>
                      <Input
                        value={currencySymbol}
                        className="h-9 text-xs font-semibold"
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Fine-Tuning Barcode Dimensions */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold border-b pb-1">Precision Scaling</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Barcode Height: <span className="font-semibold text-foreground">{barcodeHeight}px</span></span>
                    </div>
                    <Slider
                      min={20}
                      max={120}
                      step={5}
                      value={[barcodeHeight]}
                      onValueChange={(val) => setBarcodeHeight(val[0])}
                    />
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Barcode Scale (Bar Density): <span className="font-semibold text-foreground">{barcodeWidthScale}</span></span>
                    </div>
                    <Slider
                      min={1}
                      max={4}
                      step={1}
                      value={[barcodeWidthScale]}
                      onValueChange={(val) => setBarcodeWidthScale(val[0])}
                    />
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Label Font Size: <span className="font-semibold text-foreground">{fontSize}px</span></span>
                    </div>
                    <Slider
                      min={8}
                      max={18}
                      step={1}
                      value={[fontSize]}
                      onValueChange={(val) => setFontSize(val[0])}
                    />
                  </div>
                </div>

                {/* Action Print Buttons */}
                <div className="pt-2">
                  <Button
                    className="w-full h-11 bg-primary text-white font-bold hover:bg-primary/95 flex items-center justify-center gap-2 shadow-lg"
                    onClick={handleTriggerPrint}
                    disabled={selectedItems.length === 0}
                  >
                    <Printer className="w-5 h-5" /> Start Printing Now ({flattenedLabels.length} labels)
                  </Button>
                </div>

              </CardContent>
            </Card>

          </div>

        </div>



      </div>
    </DashboardLayout>
  );
}

// Width patterns for Code 128 (0 to 106)
const PATTERNS_128 = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

function renderBarcodeSvgString(value: string, width: number, height: number, showValue: boolean): string {
  const startCode = 104;
  const stopCode = 106;
  const cleanValue = value.replace(/[^\x20-\x7E]/g, "");
  if (!cleanValue) return `<div style="font-size: 8px; color: red;">Invalid Value</div>`;

  let checksum = startCode;
  const symbolIndices = [startCode];

  for (let i = 0; i < cleanValue.length; i++) {
    const charCode = cleanValue.charCodeAt(i);
    const charIndex = charCode - 32;
    symbolIndices.push(charIndex);
    checksum += charIndex * (i + 1);
  }

  symbolIndices.push(checksum % 103);
  symbolIndices.push(stopCode);

  let totalModules = 0;
  const bars: Array<{ x: number; w: number; isBar: boolean }> = [];

  symbolIndices.forEach((symIdx) => {
    const pattern = PATTERNS_128[symIdx];
    for (let p = 0; p < pattern.length; p++) {
      const moduleWidth = parseInt(pattern[p], 10);
      const isBar = p % 2 === 0;
      bars.push({ x: totalModules, w: moduleWidth, isBar });
      totalModules += moduleWidth;
    }
  });

  const svgWidth = totalModules * width;
  const svgHeight = height + (showValue ? 20 : 0);

  const rects = bars
    .filter((b) => b.isBar)
    .map((bar) => `<rect x="${bar.x * width}" y="0" width="${bar.w * width}" height="${height}" />`)
    .join("");

  const labelText = showValue
    ? `<text x="${svgWidth / 2}" y="${height + 15}" text-anchor="middle" fill="black" style="font-family: monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.15em;">${cleanValue}</text>`
    : "";

  return `
    <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMidMeet">
      <g fill="black">${rects}</g>
      ${labelText}
    </svg>
  `;
}
