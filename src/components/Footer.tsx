import { Link } from "react-router-dom";
import { Facebook, Youtube, MessageCircle } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">HozaTask</h3>
            <p className="text-sm text-background/80">
              Your trusted marketplace for everyday tasks and services
            </p>
            <div className="flex gap-4">
              <a 
                href="https://wa.link/zi7vvj" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-background/60 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={20} />
              </a>
              <a 
                href="https://www.facebook.com/hozatask" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-background/60 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://www.youtube.com/@hozatask" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-background/60 transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
              <a 
                href="https://www.tiktok.com/@hozatasks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-background/60 transition-colors"
                aria-label="TikTok"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold">For Customers</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li><Link to="/browse" className="hover:text-background transition-colors">Browse Services</Link></li>
              <li><Link to="/my-account" className="hover:text-background transition-colors">My Account</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold">For Taskers</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li><Link to="/auth" className="hover:text-background transition-colors">Sign Up</Link></li>
              <li><Link to="/supplier-submission" className="hover:text-background transition-colors">List a Service</Link></li>
              <li><Link to="/supplier-dashboard" className="hover:text-background transition-colors">My Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-background/20 text-sm text-background/80 text-center">
          <p>© 2024 HozaTask. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
