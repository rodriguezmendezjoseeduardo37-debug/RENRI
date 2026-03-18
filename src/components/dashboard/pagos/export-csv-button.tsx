"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportCsvButtonProps {
    data: any[];
    filename?: string;
}

export function ExportCsvButton({ data, filename = "pagos_export.csv" }: ExportCsvButtonProps) {
    const handleExport = () => {
        if (!data || data.length === 0) {
            toast.error("No hay datos para exportar");
            return;
        }

        try {
            // Get Headers
            const headers = Object.keys(data[0]);
            
            // Convert to CSV
            const csvRows = [];
            csvRows.push(headers.join(","));

            for (const row of data) {
                const values = headers.map(header => {
                    const mappedValue = row[header as keyof typeof row] ?? "";
                    const escaped = ('' + mappedValue).replace(/"/g, '""');
                    return `"${escaped}"`;
                });
                csvRows.push(values.join(","));
            }

            const csvString = csvRows.join("\n");
            const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success("Archivo CSV descargado");
        } catch (error) {
            toast.error("Error al exportar a CSV");
        }
    };

    return (
        <button 
            onClick={handleExport}
            className="flex items-center gap-2 border border-[#333333] px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-[#888888] hover:border-white hover:text-white transition-all uppercase"
        >
            <Download className="w-3 h-3" />
            EXPORTAR CSV
        </button>
    );
}
