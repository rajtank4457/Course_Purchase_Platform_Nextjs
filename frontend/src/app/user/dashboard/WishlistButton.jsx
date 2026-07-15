"use client";

import { Heart } from "lucide-react";
import { apiRequest, wishlistApi } from "@/lib/apiHelper";

export default function WishlistButton({
  course,
  isWishlisted,
  onWishlistChange,
}) {
  const handleWishlist = async () => {
    const res = await apiRequest(
      isWishlisted ? wishlistApi.removeFromWishlist : wishlistApi.addToWishlist,
      {
        method: "POST",
        data: {
          courseId: course.courseId,
        },
      },
    );

    if (!res.success) {
      alert(res.message || "Wishlist action failed");
      return;
    }

    onWishlistChange?.(course.courseId, !isWishlisted);
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  return (
    <button
      type="button"
      onClick={handleWishlist}
      className={`absolute left-4 top-4 z-20 rounded-full p-3 shadow-lg transition ${
        isWishlisted
          ? "bg-red-500 text-white hover:bg-red-600"
          : "bg-white text-gray-600 hover:bg-red-50 hover:text-red-500"
      }`}
      title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
    </button>
  );
}
