import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

export function StarRating({ rating, size = 14, showValue = false, reviewCount, className }: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < Math.round(rating);
          return (
            <Star
              key={i}
              size={size}
              className={filled ? "text-gold" : "text-muted-foreground/30"}
              fill={filled ? "#E8B931" : "transparent"}
            />
          );
        })}
      </div>
      {showValue && <span className="text-sm font-semibold">{rating.toFixed(1)}</span>}
      {reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground">({reviewCount})</span>
      )}
    </div>
  );
}
