"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

interface AuthCardProps {
  description?: string;
  children: React.ReactNode;
}

export function AuthCard({ description, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background px-4 pt-16 sm:items-center sm:justify-center sm:pt-0">
      <Card className="w-full border-0 shadow-none sm:max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center flex-col gap-3">
            <Image
              src={"/icon-192.png"}
              alt="icon"
              width={128}
              height={128}
            />
            <h1 className="text-[32px] font-medium font-logo">Yarukoto</h1>
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
