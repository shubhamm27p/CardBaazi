// IMPORTANT: Replace this with your actual Clerk Publishable Key
const CLERK_PUBLISHABLE_KEY = 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

if (!CLERK_PUBLISHABLE_KEY || CLERK_PUBLISHABLE_KEY.includes('XXXXX')) {
    console.warn("Please add your Clerk Publishable Key in js/auth.js!");
}

const startClerk = async () => {
    // Dynamically load the Clerk JS SDK
    const script = document.createElement('script');
    script.src = `https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = async () => {
        try {
            const Clerk = window.Clerk;
            
            // Initialize Clerk
            await Clerk.load({
                publishableKey: CLERK_PUBLISHABLE_KEY,
            });

            // Check if user is already signed in
            if (Clerk.user) {
                // If signed in, redirect to lobby
                window.location.href = 'lobby.html';
                return;
            }

            // If not signed in, mount the SignIn component
            const signInDiv = document.getElementById('sign-in');
            
            Clerk.mountSignIn(signInDiv, {
                appearance: {
                    baseTheme: "dark",
                    variables: {
                        colorPrimary: "#3b82f6",
                        colorBackground: "transparent",
                        colorInputBackground: "rgba(30, 41, 59, 0.5)",
                        colorInputText: "#f8fafc",
                        colorText: "#f8fafc",
                        colorTextSecondary: "#94a3b8",
                        borderRadius: "8px"
                    },
                    elements: {
                        card: "cl-card",
                        headerTitle: "cl-headerTitle",
                        headerSubtitle: "cl-headerSubtitle",
                        formButtonPrimary: "cl-formButtonPrimary"
                    }
                }
            });

        } catch (error) {
            console.error("Error initializing Clerk:", error);
            document.getElementById('sign-in').innerHTML = 
                `<p style="color: #ef4444; text-align: center;">Failed to load authentication. Please check your Clerk Publishable Key.</p>`;
        }
    };
    
    document.body.appendChild(script);
};

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', startClerk);
