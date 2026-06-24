import { useEffect } from "react";

const SignedPdfPage = () => {
  useEffect(() => {
    window.location.replace("/pdfs/sign-page-layout.pdf");
  }, []);

  return null;
};

export default SignedPdfPage;
