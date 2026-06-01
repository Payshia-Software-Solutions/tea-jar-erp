using System;

namespace DesktopPOS.Models
{
    public class TaxModel
    {
        public int id { get; set; }
        public string? code { get; set; }
        public string? name { get; set; }
        public double rate_percent { get; set; }
        public string? apply_on { get; set; } // 'base' or 'base_plus_previous'
        public int sort_order { get; set; }
        public int is_active { get; set; }
        
        // Calculated field for UI
        public double CalculatedAmount { get; set; }
    }
}
