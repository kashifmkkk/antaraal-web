import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Radiation, Satellite, Thermometer } from "lucide-react";

import launchImg1 from "@/assets/launch-images/12.jpeg";
import launchImg2 from "@/assets/launch-images/14.jpeg";
import launchImg3 from "@/assets/launch-images/WhatsApp Image 2026-03-31 at 10.43.05 PM.jpeg";
import launchImg4 from "@/assets/launch-images/WhatsApp Image 2026-03-31 at 10.43.06 PM.jpeg";

const launchImages = [
  { src: launchImg1, alt: "Prototype image 1" },
  { src: launchImg2, alt: "Prototype image 2" },
  { src: launchImg3, alt: "Prototype image 3" },
  { src: launchImg4, alt: "Prototype image 4" },
];

const ProductLaunch = () => {
  const features = [
    {
      icon: Radiation,
      title: "CPM Radiation Detection",
      description: "Real-time counts-per-minute monitoring with live telemetry display",
    },
    {
      icon: Satellite,
      title: "GPS + LoRa Telemetry",
      description: "Position tracking and long-range wireless data transmission",
    },
    {
      icon: Thermometer,
      title: "Multi-Sensor Payload",
      description: "Pressure, temperature, angle — complete environmental awareness",
    },
  ];

  const handleScrollToAbout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const aboutSection = document.getElementById("about");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-10 sm:py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <Badge variant="outline" className="border-primary/40 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm uppercase tracking-widest text-primary">
            Prototype Unveiled • Feb 2026
          </Badge>
        </div>

        {/* Headlines */}
        <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Introducing Antaraal's First Prototype
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl font-medium text-primary mb-6">
            India's Nuclear Eye in the Sky
          </p>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
            We are proud to unveil our first prototype: a compact nuclear radiation-detection 
            payload designed for integration with satellites and drones. Capable of detecting 
            nuclear radiation from aerial and orbital platforms — built for early threat 
            detection, nuclear leak response, and national security applications.
          </p>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-3xl mx-auto mt-4">
            India currently lacks a dedicated space-based nuclear monitoring infrastructure. 
            This prototype is our first tangible step toward building that capability 
            indigenously, at a fraction of conventional cost.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-16 max-w-5xl mx-auto">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border border-primary/20 bg-card/80 hover:shadow-card transition-all duration-300"
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-3 text-primary">
                  <feature.icon className="w-5 h-5" />
                  <span className="text-sm tracking-wide uppercase">{feature.title}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Image Carousel */}
        <div className="mb-6 sm:mb-8 max-w-4xl mx-auto px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {launchImages.map((image, index) => (
                <CarouselItem key={index} className="basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/2">
                  <div className="p-2">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full aspect-square rounded-xl shadow-lg object-cover bg-muted"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Video Embed */}
        <div className="max-w-4xl mx-auto mb-10 sm:mb-12">
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <iframe
              src="https://www.youtube.com/embed/x3PWMbMU9V4"
              title="Prototype Demo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-primary to-warning hover:shadow-elegant"
          >
            <a href="mailto:team@antaraalspace.com">Talk to Our Team</a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
          >
            <a href="#about" onClick={handleScrollToAbout}>
              Learn More About Our Mission
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductLaunch;
