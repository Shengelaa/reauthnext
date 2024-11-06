"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
type Props = {
  twoFactorActivated: boolean;
};

import { QRCodeSVG } from "qrcode.react";
import { activate2fa, get2faSecret } from "./action";
import { useToast } from "@/hooks/use-toast";

export default function TwoFactorAuthForm({ twoFactorActivated }: Props) {
  const [isActivated, setIsActivated] = useState(twoFactorActivated);
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const [otp, setOtp] = useState("");

  const handleEnableClick = async () => {
    const response = await get2faSecret();

    if (response.error) {
      toast({
        variant: "destructive",
        title: response.message,
      });
      return;
    }

    setStep(2);
    setCode(response.twoFactorSecret ?? "");
    console.log(response.twoFactorSecret);
  };
  const handleOTPSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const response = await activate2fa(otp);

    if (response?.error) {
      toast({
        variant: "destructive",
        title: response.message,
      });
      return;
    }
    toast({
      className: "bg-green-500 text-white",
      title: "Two-Factor Has Been Enabled",
    });

    setIsActivated(true);
    return (
      <div>
        {!isActivated && (
          <div>
            {step === 1 && (
              <Button onClick={handleEnableClick}>
                Enable Two-Factor Authentication
              </Button>
            )}
            {step === 2 && (
              <div>
                <p>
                  Scan the QR code below in the Google Authenticator App To
                  Activate Two-Factor Authenticition.
                </p>
                <QRCodeSVG value={code} />
                <Button
                  onClick={() => setStep(3)}
                  className='w-full my-2'
                  variant='outline'>
                  I Have Scanned The Qr Code
                </Button>
                <Button
                  onClick={() => setStep(1)}
                  className='w-full my-2'
                  variant='outline'>
                  Cancel
                </Button>
              </div>
            )}
            {step === 3 && (
              <form onSubmit={handleOTPSubmit}>
                <p>Enter One-Time Passcode.</p>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <Button disabled={otp.length !== 6} type='submit'>
                  Submit And Activate
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  className='w-full my-2'
                  variant='outline'>
                  Cancel
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    );
  };
}
