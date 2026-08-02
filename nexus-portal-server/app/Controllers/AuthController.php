<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Models\AdminModel;

class AuthController extends Controller {
    public function login() {
        $data = $this->getPostData();
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        $model = new AdminModel();
        $user = $model->findByUsername($username);

        if ($user && password_verify($password, $user->password)) {
            if ($user->email_verified == 0) {
                return $this->json(['status' => 'error', 'message' => 'Email verification required. Please check your inbox.'], 403);
            }
            $_SESSION['admin_id'] = $user->id;
            $_SESSION['admin_user'] = $user->username;
            $_SESSION['admin_role'] = $user->role;
            $_SESSION['tenant_id'] = $user->tenant_id;
            return $this->json(['status' => 'success', 'user' => $user->username, 'role' => $user->role, 'token' => session_id()]);
        } else {
            return $this->json(['status' => 'error', 'message' => 'Invalid credentials'], 401);
        }
    }

    public function register() {
        $data = $this->getPostData();
        
        // Basic validation
        if (empty($data['company_name']) || empty($data['email']) || empty($data['password'])) {
            return $this->json(['status' => 'error', 'message' => 'Missing required registration fields'], 400);
        }

        // 1. Initialize Models
        $tenantModel = new \App\Models\TenantModel();
        $adminModel = new \App\Models\AdminModel();

        // 2. Prepare Tenant Data
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['company_name'])));
        $tenantData = [
            'name' => $data['company_name'],
            'address' => $data['address'] ?? '',
            'business_type' => $data['business_type'] ?? '',
            'admin_email' => $data['email'],
            'slug' => $slug,
            'package_id' => $data['package_id'] ?? 1
        ];

        // 3. Create Tenant
        $tenantResult = $tenantModel->create($tenantData);
        if (!$tenantResult) {
            return $this->json(['status' => 'error', 'message' => 'Failed to create business profile'], 500);
        }

        // 4. Create Portal Admin linked to Tenant
        $token = bin2hex(random_bytes(32));
        $adminData = [
            'tenant_id' => $tenantResult['id'],
            'username' => $data['email'], // Use email as default username
            'password' => $data['password'],
            'full_name' => $data['contact_person'] ?? $data['company_name'],
            'verification_token' => $token,
            'role' => 'client'
        ];

        if ($adminModel->create($adminData)) {
            // 5. Send Verification Email
            \App\Core\Mailer::sendVerificationEmail($data['email'], $adminData['full_name'], $token);

            return $this->json([
                'status' => 'success', 
                'message' => 'Registration successful! Please check your email to verify your account before logging in.',
                'license_key' => $tenantResult['license']
            ]);
        } else {
            return $this->json(['status' => 'error', 'message' => 'Business profile created, but user account failed'], 500);
        }
    }

    public function verify() {
        $token = $_GET['token'] ?? '';
        if (empty($token)) {
            return $this->json(['status' => 'error', 'message' => 'Invalid or missing verification token'], 400);
        }

        $model = new \App\Models\AdminModel();
        $user = $model->findByToken($token);

        if ($user) {
            if ($model->verifyByToken($token)) {
                return $this->json(['status' => 'success', 'message' => 'Your email has been verified! You can now log in.']);
            }
            return $this->json(['status' => 'error', 'message' => 'Verification failed on server side'], 500);
        } else {
            return $this->json(['status' => 'error', 'message' => 'Token has expired or is invalid'], 404);
        }
    }

    public function logout() {
        session_destroy();
        return $this->json(['status' => 'success', 'message' => 'Logged out']);
    }

    public function check() {
        if (isset($_SESSION['admin_id'])) {
            return $this->json([
                'status' => 'success', 
                'user' => $_SESSION['admin_user'],
                'role' => $_SESSION['admin_role'] ?? 'client'
            ]);
        } else {
            return $this->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }
    }
}
