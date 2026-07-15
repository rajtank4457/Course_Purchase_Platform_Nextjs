"use client";

import { useRouter } from "next/navigation";
import { apiRequest, libraryApi, cartApi } from "@/lib/apiHelper";
import { ShoppingCart } from "lucide-react";

export default function CourseActionButton({
  course,
  isInCart,
  isInLibrary,
  onCartAdded,
  onLibraryAdded,
}) {
  const router = useRouter();

  const handleAddToLibrary = async () => {
    try {
      const res = await apiRequest(libraryApi.addToLibrary, {
        method: "POST",
        data: {
          courseId: course.courseId,
        },
      });

      if (!res.success) {
        alert(res.message);
        return;
      }

      if (onLibraryAdded) {
        onLibraryAdded(course);
      }

      window.dispatchEvent(new Event("libraryUpdated"));
    } catch (err) {
      console.log(err);
      alert("Failed to add course to library");
    }
  };

  const handleAddToCart = async () => {
    try {
      const res = await apiRequest(cartApi.addToCart, {
        method: "POST",
        data: {
          courseId: course.courseId,
        },
      });

      if (!res.success) {
        alert(res.message);
        return;
      }

      if (onCartAdded) {
        onCartAdded(course);
      }

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.log(err);
      alert("Failed to add course to cart");
    }
  };

  if (isInLibrary) {
    return (
      <button
        onClick={() => router.push("/user/courses")}
        className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
      >
        Go To Library
      </button>
    );
  }

  if (Number(course.courseType) === 1) {
    return (
      <button
        onClick={() => {
          if (isInCart) {
            router.push("/user/cart");
          } else {
            handleAddToCart();
          }
        }}
        className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition ${
          isInCart
            ? "bg-purple-700 hover:bg-purple-800"
            : "bg-orange-600 hover:bg-orange-700"
        }`}
      >
        <ShoppingCart className="h-4 w-4" />
        {isInCart ? "Go To Cart" : "Add To Cart"}
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToLibrary}
      className="rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
    >
      Add To Library
    </button>
  );
}
