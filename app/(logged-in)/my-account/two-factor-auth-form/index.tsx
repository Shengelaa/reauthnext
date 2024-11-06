"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { QRCodeSVG } from "qrcode.react";
import { activate2fa, get2faSecret } from "./action";
import { useToast } from "@/hooks/use-toast";

type Props = {
  twoFactorActivated: boolean;
};

export default function TwoFactorAuthForm({ twoFactorActivated }: Props) {
  const [isActivated, setIsActivated] = useState(twoFactorActivated);
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const [otp, setOtp] = useState("");

  const handleEnableClick = async () => {
    //   {
    //     error: true,
    //     message: "Unauthorized",
    //   }
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
    //                              132 - 123
    const response = await activate2fa(otp);

    // {
    // error: true,
    // message: "Invalid OTP",
    //   }

    if (response?.error) {
      toast({
        variant: "destructive",
        title: response.message,
      });
      return;
    }
    toast({
      className: "bg-green-500 text-white",
      title: "Two-Factor has been enabled",
    });

    setIsActivated(true);
  };

  return (
    <div>
      {isActivated && <div>All done </div>}
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
                Scan the QR code below in the Google Authenticator app to
                activate Two-Factor Authetication.
              </p>
              <QRCodeSVG value={code} />
              <Button
                onClick={() => setStep(3)}
                className='w-full my-2'
                variant='outline'>
                I have scanned the QR code
              </Button>
              <Button onClick={() => setStep(1)} className='w-full my-2'>
                Cancel
              </Button>
            </div>
          )}
          {step === 3 && (
            <form onSubmit={handleOTPSubmit}>
              <p>Enter one-time passcode</p>
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
                Submit and activate
              </Button>
              <Button onClick={() => setStep(2)}>Cancel</Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
