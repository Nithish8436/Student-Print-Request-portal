import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// Utility function to clean up auth state
const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session) {
        try {
          // First check if profile exists
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (error) {
            console.error("Error fetching user profile:", error);
            setCurrentUser(session.user);
            return;
          }

          if (profile) {
            setCurrentUser({
              ...session.user,
              ...profile
            });
          } else {
            // If no profile exists, create one
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: session.user.id,
                  email: session.user.email,
                  role: 'student',
                  name: session.user.user_metadata?.name || session.user.email.split('@')[0]
                }
              ])
              .select()
              .single();

            if (insertError) {
              console.error("Error creating user profile:", insertError);
              setCurrentUser(session.user);
            } else {
              setCurrentUser({
                ...session.user,
                ...newProfile
              });
            }
          }
        } catch (error) {
          console.error("Error in profile handling:", error);
          setCurrentUser(session.user);
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: profile, error }) => {
            if (error) {
              console.error("Error fetching user profile:", error);
              setCurrentUser(session.user);
              return;
            }

            if (profile) {
              setCurrentUser({
                ...session.user,
                ...profile
              });
            } else {
              // If no profile exists, create one
              supabase
                .from('profiles')
                .insert([
                  {
                    id: session.user.id,
                    email: session.user.email,
                    role: 'student',
                    name: session.user.user_metadata?.name || session.user.email.split('@')[0]
                  }
                ])
                .select()
                .single()
                .then(({ data: newProfile, error: insertError }) => {
                  if (insertError) {
                    console.error("Error creating user profile:", insertError);
                    setCurrentUser(session.user);
                  } else {
                    setCurrentUser({
                      ...session.user,
                      ...newProfile
                    });
                  }
                });
            }
            setLoading(false);
          })
          .catch((error) => {
            console.error("Session error:", error);
            setCurrentUser(null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      // Clean up existing auth state
      cleanupAuthState();
      
      // Try global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log("Pre-signout failed, continuing with login");
      }

      // Handle special accounts
      if (email === 'admin@gmail.com' && password === 'password123') {
        // For admin, create a mock session
        const mockUser = {
          id: 'admin-user',
          email: 'admin@gmail.com',
          role: 'admin',
          name: 'Admin User'
        };

        setCurrentUser(mockUser);
        return mockUser;
      } else if (email === 'xerox@gmail.com' && password === 'password123') {
        // For xerox, create a mock session
        const mockUser = {
          id: 'xerox-user',
          email: 'xerox@gmail.com',
          role: 'xerox',
          name: 'Xerox User'
        };

        setCurrentUser(mockUser);
        return mockUser;
      } else {
        // Regular login for other accounts
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (error) throw error;

          const user = {
            ...data.user,
            ...profile
          };

          setCurrentUser(user);
          setSession(data.session);
          return user;
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(error.message || "Failed to log in");
    }
  };

  const signup = async (name, rollNumber, email, password) => {
    try {
      // Clean up existing auth state
      cleanupAuthState();
      
      // First check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            rollNumber,
            role: 'student'
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile with explicit columns
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name: name,
            roll_number: rollNumber,
            role: 'student',
            email: email
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // If profile creation fails, we should clean up the auth user
          await supabase.auth.admin.deleteUser(data.user.id);
          throw new Error('Failed to create user profile');
        }

        toast.success("Account created successfully! Please check your email for verification.");
        return data.user;
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw new Error(error.message || "Failed to create account");
    }
  };

  const logout = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      setCurrentUser(null);
      setSession(null);
      
      // Force full page refresh for clean state
      window.location.href = '/login';
    } catch (error) {
      toast.error("Error logging out");
      console.error("Logout error:", error);
    }
  };

  const value = {
    currentUser,
    session,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;