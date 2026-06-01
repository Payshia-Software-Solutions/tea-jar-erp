using System.Collections.Generic;

namespace DesktopPOS.Models
{
    public class LoginResponse
    {
        public string? token { get; set; }
        public UserDetails? user { get; set; }
    }

    public class UserDetails
    {
        public int id { get; set; }
        public string? name { get; set; }
        public string? email { get; set; }
        public string? role { get; set; }
        public int? role_id { get; set; }
        public int location_id { get; set; }
        public string? location_name { get; set; }
        public List<LocationInfo>? allowed_locations { get; set; }
    }

    public class LocationInfo
    {
        public int id { get; set; }
        public string? name { get; set; }
    }
}
