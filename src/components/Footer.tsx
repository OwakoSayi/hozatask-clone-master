import { useNavigate } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export const Footer = () => {
  const navigate = useNavigate();
  
  return (
    <footer className="bg-primary text-primary-foreground py-10">
      <div className="container mx-auto px-4">
        {/* Social Links */}
        <div className="flex justify-center gap-4 mb-8">
          <a href="#" className="w-10 h-10 rounded-full border border-primary-foreground/30 flex items-center justify-center hover:bg-primary-foreground/10 transition-colors">
            <Facebook className="w-5 h-5" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full border border-primary-foreground/30 flex items-center justify-center hover:bg-primary-foreground/10 transition-colors">
            <Twitter className="w-5 h-5" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full border border-primary-foreground/30 flex items-center justify-center hover:bg-primary-foreground/10 transition-colors">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full border border-primary-foreground/30 flex items-center justify-center hover:bg-primary-foreground/10 transition-colors">
            <Linkedin className="w-5 h-5" />
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Discover */}
          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4">Discover</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Become a Tasker</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Services in My City</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Services Nearby</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Life Hacks</a></li>
            </ul>
          </div>
          
          {/* Company */}
          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Press</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">HozaTask for Good</a></li>
            </ul>
          </div>
          
          {/* Support */}
          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Safety Info</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Logo and Copyright */}
        <div className="border-t border-primary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 
              className="text-2xl font-bold cursor-pointer" 
              onClick={() => navigate("/")}
            >
              HozaTask
            </h3>
            <p className="text-sm text-primary-foreground/80">
              © 2024 HozaTask. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
