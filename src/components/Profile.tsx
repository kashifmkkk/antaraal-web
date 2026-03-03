import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function ProfileComponent() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-col items-center">
        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src="/placeholder-user.jpg" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl">Charles Leclerc</CardTitle>
        <CardDescription>Software Engineer</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p>Charles is a software engineer at Google. He is passionate about building scalable and reliable software.</p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button>Edit Profile</Button>
      </CardFooter>
    </Card>
  );
}
