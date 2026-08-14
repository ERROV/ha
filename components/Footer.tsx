"use client";

import { motion } from "framer-motion";
import { Copyright, Building2 } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border-t border-border text-muted-foreground py-6 text-center mt-10 shadow-sm"
    >
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-center items-center gap-2">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1.5 text-sm"
        >
          <Copyright className="w-4 h-4 text-primary" />
          <span className="text-foreground font-medium">{currentYear} Mohsen Ali</span>
          <span className="hidden sm:inline text-muted-foreground">•</span>
          <span className="text-muted-foreground text-xs">mohsenalitaklife@gmail.com</span>
        </motion.div>

        <div className="hidden sm:block text-border">|</div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1.5 text-sm"
        >
          <Building2 className="w-4 h-4 text-primary" />
          <span className="text-foreground font-semibold">HALA FTTH</span>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;