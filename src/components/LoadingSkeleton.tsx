interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
}

export function LoadingSkeleton({
  width = "100%",
  height = "20px",
  borderRadius = "8px",
}: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius }}
    />
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="course-card">
      <div className="skeleton" style={{ height: 190 }} />
      <div className="course-body">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="skeleton" style={{ width: "40%", height: 14, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: "20%", height: 14, borderRadius: 8 }} />
        </div>
        <div className="skeleton" style={{ width: "80%", height: 22, borderRadius: 8, marginTop: 12 }} />
        <div className="skeleton" style={{ width: "100%", height: 14, borderRadius: 8, marginTop: 10 }} />
        <div className="skeleton" style={{ width: "60%", height: 14, borderRadius: 8, marginTop: 6 }} />
        <div className="skeleton" style={{ width: "100%", height: 9, borderRadius: 99, marginTop: 16 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <div className="skeleton" style={{ width: "30%", height: 14, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 80, height: 36, borderRadius: 99 }} />
        </div>
      </div>
    </div>
  );
}

export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="course-grid">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", padding: 14 }}>
      <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: "60%", height: 16, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: "30%", height: 12, borderRadius: 8, marginTop: 8 }} />
      </div>
    </div>
  );
}
