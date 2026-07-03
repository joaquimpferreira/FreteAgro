/// <reference types="expo/types" />

// NOTE: This file should not be edited and should be in your git ignore list for now.

declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL: string
    EXPO_PUBLIC_SUPABASE_ANON_KEY: string
    [key: string]: string | undefined
  }
}
