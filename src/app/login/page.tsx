"use client";
import { FcGoogle } from "react-icons/fc";

export default function GoogleLoginButton() {
    function googleLogin() {
        const clientId = '706088875754-n7cortpqmp75gft18b5c5j4dons8cuic.apps.googleusercontent.com';
        const redirectUri = 'http://localhost:3000/auth/callback';
        const scope = 'openid email profile';
        const responseType = 'code';
        const state = 'random_state_string';
        const accessType = 'offline';
        const prompt = 'consent';
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=${responseType}&state=${state}&access_type=${accessType}&prompt=${prompt}`;
        
        console.log('Redirecting to:', authUrl);
        window.location.href = authUrl;
    }       

    return (
        <button
            onClick={googleLogin}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-100"
        >
            <FcGoogle className="text-xl" />
            <span>Sign in with Google</span>
        </button>
    );
}
