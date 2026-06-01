using DesktopPOS.Models;
using System;
using System.Threading.Tasks;

namespace DesktopPOS.Services
{
    public class AuthService : ApiService
    {
        public async Task<LoginResponse?> LoginAsync(string email, string password)
        {
            try
            {
                var request = new LoginRequest { email = email, password = password };
                var response = await PostAsync<ApiResponse<LoginResponse>>("auth/login", request);

                if (response != null && response.data != null)
                {
                    // Store the token globally for subsequent API calls
                    JwtToken = response.data.token;
                    return response.data;
                }
                
                return null;
            }
            catch (Exception ex)
            {
                // In a real app, log the exception or handle non-200 status codes appropriately
                throw new Exception($"Login failed: {ex.Message}");
            }
        }
    }
}
