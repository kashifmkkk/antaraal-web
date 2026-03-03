import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook } from "lucide-react";
import Logo from "@/components/Logo";

const Footer = () => {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Logo className="w-8 h-8 object-contain" />
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">
                Antaraal
              </h3>
            </div>
            <p className="text-muted-foreground">
              India's premier aerospace parts marketplace connecting buyers and suppliers 
              with verified quality assurance and comprehensive MRO services.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Facebook className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <div className="space-y-3">
              {[
                "Browse Products",
                "Find Vendors",
                "Post RFQ",
                "Overhaul Services",
                "Warranty Tracking",
                "Complaint Management"
              ].map((link) => (
                <div key={link}>
                  <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-foreground">
                    {link}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">Support</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span>support@antaraal.com</span>
              </div>
              <div className="flex items-start space-x-3 text-sm">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <div>Aerospace Hub, Sector 18</div>
                  <div>Gurugram, Haryana 122015</div>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">Stay Updated</h4>
            <p className="text-muted-foreground text-sm">
              Get the latest aerospace industry news and platform updates.
            </p>
            <div className="space-y-3">
              <Input placeholder="Enter your email" className="bg-muted" />
              <Button className="w-full bg-gradient-to-r from-primary to-warning">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2026 Antaraal. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm">
            <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Button>
            <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-foreground">
              Terms of Service
            </Button>
            <Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-foreground">
              Cookie Policy
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;