"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "blue" | "contrast";
type FontSize = "standard" | "large" | "xl";
type ButtonSize = "small" | "medium" | "large";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
    buttonSize: ButtonSize;
    setButtonSize: (size: ButtonSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>("light");
    const [fontSize, setFontSize] = useState<FontSize>("standard");
    const [buttonSize, setButtonSize] = useState<ButtonSize>("medium");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme") as Theme;
        const storedFontSize = localStorage.getItem("fontSize") as FontSize;
        const storedButtonSize = localStorage.getItem("buttonSize") as ButtonSize;

        if (storedTheme) setTheme(storedTheme);
        if (storedFontSize) setFontSize(storedFontSize);
        if (storedButtonSize) setButtonSize(storedButtonSize);

        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = window.document.documentElement;
        root.classList.remove("light", "dark", "blue", "contrast");
        root.classList.add(theme);
        localStorage.setItem("theme", theme);
    }, [theme, mounted]);

    useEffect(() => {
        if (!mounted) return;

        const root = window.document.documentElement;
        // Reset font size classes
        root.classList.remove("text-standard", "text-large", "text-xl");
        root.classList.add(`text-${fontSize}`);
        localStorage.setItem("fontSize", fontSize);
    }, [fontSize, mounted]);

    useEffect(() => {
        if (!mounted) return;
        const root = window.document.documentElement;
        root.classList.remove("btn-scale-small", "btn-scale-medium", "btn-scale-large");
        root.classList.add(`btn-scale-${buttonSize}`);
        localStorage.setItem("buttonSize", buttonSize);
    }, [buttonSize, mounted]);



    return (
        <ThemeContext.Provider
            value={{
                theme,
                setTheme,
                fontSize,
                setFontSize,
                buttonSize,
                setButtonSize,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
