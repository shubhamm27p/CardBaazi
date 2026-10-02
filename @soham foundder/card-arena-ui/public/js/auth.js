window.addEventListener('load', async function() {
    try {
        const Clerk = window.Clerk;
        
        if (!Clerk) {
            throw new Error("Clerk script not loaded.");
        }

        // Initialize Clerk
        await Clerk.load({
            publishableKey: 'pk_test_cmVuZXdlZC1zaGVlcGRvZy04MjE2LmNsZXJrLmFjY291bnRzLmRldiQ'
        });

        // Check if user is already signed in
        if (Clerk.user) {
            // If signed in, redirect to main hub
            window.location.href = '/index.html';
            return;
        }

        // If not signed in, mount the SignIn component
        const signInDiv = document.getElementById('sign-in');
        
        Clerk.mountSignIn(signInDiv, {
            appearance: {
                variables: {
                    colorPrimary: "#D4AF37", // Gold
                    colorBackground: "#1a1a24", // Dark background
                    colorInputBackground: "rgba(255, 255, 255, 0.05)", // Slightly lighter so it's visible
                    colorInputText: "#ffffff", // White text for inputs
                    colorText: "#ffffff",
                    colorTextSecondary: "#a1a1aa",
                    borderRadius: "8px"
                },
                elements: {
                    card: {
                        backgroundColor: "#1a1a24",
                        border: "1px solid rgba(212, 175, 55, 0.3)"
                    },
                    formFieldInput: {
                        border: "1px solid rgba(212, 175, 55, 0.5)",
                        backgroundColor: "rgba(255, 255, 255, 0.05)"
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error initializing Clerk:", error);
        document.getElementById('sign-in').innerHTML = 
            `<p style="color: #ef4444; text-align: center;">Failed to load authentication. Please check your Clerk Publishable Key.</p>`;
    }
});
