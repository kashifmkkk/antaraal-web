
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    id: 1,
    name: "Engine Overhaul",
    description: "Complete overhaul services for a wide range of jet engines.",
    turnaroundTime: "4-6 Weeks",
    image: "/placeholder.svg",
  },
  {
    id: 2,
    name: "Avionics Repair",
    description: "Repair and certification of modern avionics systems.",
    turnaroundTime: "2-3 Weeks",
    image: "/placeholder.svg",
  },
  {
    id: 3,
    name: "Landing Gear Maintenance",
    description: "Comprehensive maintenance and repair for landing gear assemblies.",
    turnaroundTime: "5-7 Weeks",
    image: "/placeholder.svg",
  },
  {
    id: 4,
    name: "Component Testing",
    description: "Advanced testing and certification for various aircraft components.",
    turnaroundTime: "1-2 Weeks",
    image: "/placeholder.svg",
  },
];

const OverhaulServices = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Overhaul Services</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            <img src={service.image} alt={service.name} className="w-full h-40 object-cover" />
            <CardHeader>
              <CardTitle>{service.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{service.description}</p>
              <p className="text-sm mt-4 font-semibold">Turnaround Time: {service.turnaroundTime}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OverhaulServices;
