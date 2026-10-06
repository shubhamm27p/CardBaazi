window.addEventListener('load', async function() {
    try {
        const Clerk = window.Clerk;
        
        if (!Clerk) {
            throw new Error("Clerk script not loaded.");
        }

        // Initialize Clerk
        await Clerk.load({
            publishableKey: 'pk_test_c2Vuc2libGUtdG91Y2FuLTY0MjguY2xlcmsuYWNjb3VudHMuZGV2JA'
        });

        // Check if user is already signed in
        if (Clerk.user || Clerk.session || (Clerk.client && Clerk.client.activeSessions && Clerk.client.activeSessions.length > 0)) {
            // If signed in, redirect to main hub
            window.location.href = '/index.html';
            return;
        }

        // Listen for auth state changes
        Clerk.addListener(({ user }) => {
            if (user) {
                window.location.href = '/index.html';
            }
        });

        // If not signed in, mount the SignIn component
        const signInDiv = document.getElementById('sign-in');
        
        const redirectUrl = window.location.origin + '/index.html';
        Clerk.mountSignIn(signInDiv, {
            routing: "hash",
            afterSignInUrl: redirectUrl,
            afterSignUpUrl: redirectUrl,
            redirectUrl: redirectUrl,
            appearance: {
                variables: {
                    colorPrimary: "#3b82f6", // Blue accent
                    colorBackground: "transparent", // Transparent to use container bg
                    colorInputBackground: "#f8fafc",
                    colorInputText: "#0f172a",
                    colorText: "#0f172a",
                    colorTextSecondary: "#475569",
                    borderRadius: "8px"
                },
                elements: {
                    watermark: {
                        display: "none",
                        opacity: 0
                    },
                    card: {
                        backgroundColor: "transparent",
                        border: "none",
                        boxShadow: "none"
                    },
                    formFieldInput: {
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        backgroundColor: "#ffffff",
                        padding: "0.75rem"
                    },
                    socialButtonsBlockButton: {
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                        transition: "all 0.2s ease",
                        padding: "0.75rem",
                        '&:hover': {
                            backgroundColor: "#f8fafc",
                            border: "1px solid #cbd5e1"
                        }
                    },
                    socialButtonsBlockButtonText: {
                        fontWeight: "600",
                        color: "#334155",
                        fontSize: "15px"
                    }
                }
            }
        });

        // Intelligently Inject Missing Social Buttons Observer
        const observer = new MutationObserver(() => {
            const socialBlock = document.querySelector('.cl-socialButtons'); // Clerk wrapper for social buttons
            if (!socialBlock) return;

            // Helper to check if a native button exists
            const hasNativeProvider = (providerStr) => {
                const buttons = Array.from(socialBlock.querySelectorAll('button'));
                return buttons.some(btn => btn.innerText.toLowerCase().includes(providerStr));
            };

            // Inject Custom Google Button if missing
            if (!hasNativeProvider('google') && !document.getElementById('custom-google-btn')) {
                const googleBtn = document.createElement('button');
                googleBtn.id = 'custom-google-btn';
                googleBtn.type = 'button';
                googleBtn.style.backgroundColor = '#ffffff';
                googleBtn.style.border = '1px solid #e2e8f0';
                googleBtn.style.borderRadius = '8px';
                googleBtn.style.padding = '0.75rem';
                googleBtn.style.display = 'flex';
                googleBtn.style.alignItems = 'center';
                googleBtn.style.justifyContent = 'center';
                googleBtn.style.gap = '10px';
                googleBtn.style.width = '100%';
                googleBtn.style.cursor = 'pointer';
                googleBtn.style.marginTop = '10px';
                googleBtn.style.transition = 'all 0.2s ease';
                googleBtn.style.boxShadow = '0 1px 2px 0 rgba(0,0,0,0.05)';
                
                googleBtn.onmouseover = () => { googleBtn.style.backgroundColor = '#f8fafc'; googleBtn.style.borderColor = '#cbd5e1'; };
                googleBtn.onmouseout = () => { googleBtn.style.backgroundColor = '#ffffff'; googleBtn.style.borderColor = '#e2e8f0'; };

                googleBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span style="font-weight: 600; color: #334155; font-size: 15px;">Continue with Google</span>
                `;

                googleBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    Clerk.client.signIn.authenticateWithRedirect({
                        strategy: 'oauth_google',
                        redirectUrl: '/index.html',
                        redirectUrlComplete: '/index.html'
                    }).catch(err => {
                        console.error(err);
                        alert("Google OAuth is not enabled in your Clerk Dashboard yet! Please go to Clerk Dashboard -> User Authentication -> Social Connections to enable Google.");
                    });
                });

                socialBlock.insertBefore(googleBtn, socialBlock.firstChild); // Put Google at the top
            }

            // Inject Custom Facebook Button if missing
            if (!hasNativeProvider('facebook') && !document.getElementById('custom-fb-btn')) {
                const fbBtn = document.createElement('button');
                fbBtn.id = 'custom-fb-btn';
                fbBtn.type = 'button';
                fbBtn.style.backgroundColor = '#ffffff';
                fbBtn.style.border = '1px solid #e2e8f0';
                fbBtn.style.borderRadius = '8px';
                fbBtn.style.padding = '0.75rem';
                fbBtn.style.display = 'flex';
                fbBtn.style.alignItems = 'center';
                fbBtn.style.justifyContent = 'center';
                fbBtn.style.gap = '10px';
                fbBtn.style.width = '100%';
                fbBtn.style.cursor = 'pointer';
                fbBtn.style.marginTop = '10px';
                fbBtn.style.transition = 'all 0.2s ease';
                fbBtn.style.boxShadow = '0 1px 2px 0 rgba(0,0,0,0.05)';
                
                fbBtn.onmouseover = () => { fbBtn.style.backgroundColor = '#f8fafc'; fbBtn.style.borderColor = '#cbd5e1'; };
                fbBtn.onmouseout = () => { fbBtn.style.backgroundColor = '#ffffff'; fbBtn.style.borderColor = '#e2e8f0'; };

                fbBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span style="font-weight: 600; color: #334155; font-size: 15px;">Continue with Facebook</span>
                `;

                fbBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    Clerk.client.signIn.authenticateWithRedirect({
                        strategy: 'oauth_facebook',
                        redirectUrl: '/index.html',
                        redirectUrlComplete: '/index.html'
                    }).catch(err => {
                        console.error(err);
                        alert("Facebook OAuth is not enabled in your Clerk Dashboard yet! Please go to Clerk Dashboard -> User Authentication -> Social Connections to enable Facebook.");
                    });
                });

                socialBlock.appendChild(fbBtn);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

    } catch (error) {
        console.error("Error initializing Clerk:", error);
        document.getElementById('sign-in').innerHTML = 
            `<p style="color: #ef4444; text-align: center;">Failed to load authentication. Please check your Clerk Publishable Key.</p>`;
    }
});
