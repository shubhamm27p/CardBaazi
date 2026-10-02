window.addEventListener('load', async function() {
    try {
        const Clerk = window.Clerk;
        if (!Clerk) {
            console.error("Clerk not found");
            return;
        }

        await Clerk.load({
            publishableKey: 'pk_test_cmVuZXdlZC1zaGVlcGRvZy04MjE2LmNsZXJrLmFjY291bnRzLmRldiQ'
        });

        if (!Clerk.user) {
            // Not authenticated, redirect to login page
            window.location.href = '/login.html';
        } else {
            // If they are logged in, we can optionally mount a UserButton somewhere if an element exists
            const userButtonDiv = document.getElementById('user-button');
            if (userButtonDiv) {
                const darkGoldAppearance = {
                    variables: {
                        colorPrimary: "#D4AF37",
                        colorBackground: "#1a1a24",
                        colorText: "#ffffff",
                        colorTextSecondary: "#a1a1aa",
                        colorInputBackground: "#0F0F13",
                    },
                    elements: {
                        card: {
                            backgroundColor: "#1a1a24",
                            border: "1px solid rgba(212, 175, 55, 0.2)"
                        },
                        navbar: { background: "#0F0F13" },
                        navbarButton: { color: "#a1a1aa" },
                        headerTitle: { color: "#D4AF37" },
                        headerSubtitle: { color: "#a1a1aa" },
                        profileSectionTitle: { color: "#D4AF37", borderBottom: "1px solid rgba(212,175,55,0.2)" },
                        profileSectionContent: { color: "#ffffff" },
                        formButtonPrimary: { backgroundColor: "#D4AF37", color: "#000" },
                        formFieldInput: { backgroundColor: "#0F0F13", borderColor: "rgba(212, 175, 55, 0.3)" },
                        userButtonPopoverCard: {
                            backgroundColor: "#1a1a24",
                            border: "1px solid rgba(212, 175, 55, 0.2)"
                        },
                        userButtonPopoverActionButton: {
                            color: "#ffffff",
                            '&:hover': { backgroundColor: "rgba(212, 175, 55, 0.1)" }
                        },
                        userButtonPopoverActionButtonText: { color: "#ffffff" },
                        userButtonPopoverActionButtonIcon: { color: "#D4AF37" },
                        userButtonPopoverFooter: { borderTop: "1px solid rgba(212, 175, 55, 0.2)" },
                        userPreviewMainIdentifier: { color: "#D4AF37" },
                        userPreviewSecondaryIdentifier: { color: "#a1a1aa" }
                    }
                };

                Clerk.mountUserButton(userButtonDiv, {
                    appearance: darkGoldAppearance,
                    userProfileProps: {
                        appearance: darkGoldAppearance
                    },
                    afterSignOutUrl: "/login.html"
                });
            }
        }
    } catch (error) {
        console.error("Error loading Clerk:", error);
    }
});
