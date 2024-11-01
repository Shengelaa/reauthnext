import { auth } from "@/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default async function MyAccount() {
  const session = await auth();
  return (
    <Card className='w-[350px]'>
      <CardHeader>My Account</CardHeader>
      <CardContent>
        <Label>Email Address</Label>
        <div className='text-muted-foreground'>{session?.user?.email}</div>
      </CardContent>
    </Card>
  );
}
