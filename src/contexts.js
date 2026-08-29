import { createContext, useContext } from 'react'

// Pulled out of App.jsx on purpose: App.jsx imports Home.jsx directly
// (not lazily, since it's the landing route), and Home.jsx needs
// useAuth/useModules — importing those FROM App.jsx created a real
// circular dependency (src/App.jsx -> src/pages/Home.jsx -> src/App.jsx),
// confirmed by Rollup's circular-dependency warning during build. This
// file has zero dependents of its own, so nothing can ever cycle back
// through it. App.jsx still re-exports everything below for backward
// compatibility — every other page that does
// `import { useAuth, useModules } from '../App'` keeps working
// unchanged.
export const ThemeContext = createContext()
export const AuthContext = createContext()
export const ModulesContext = createContext()

export function useTheme() { return useContext(ThemeContext) }
export function useAuth() { return useContext(AuthContext) }
export function useModules() { return useContext(ModulesContext) }
