// @ts-nocheck
import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "white", color: "red", height: "100vh", width: "100vw", position: "fixed", top: 0, left: 0, zIndex: 999999, overflow: "auto", fontFamily: "sans-serif" }}>
          <h2>Application Crash Error</h2>
          <p>Terjadi kesalahan teknis. Error ini telah ditangkap oleh Global Error Boundary.</p>
          <details style={{ whiteSpace: "pre-wrap", marginTop: "10px", background: "#f8f8f8", padding: "10px", borderRadius: "5px", color: "#333", fontSize: "12px" }}>
            <summary>Lihat Rincian Teknis</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: "20px", padding: "10px 15px", background: "#d32f2f", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
