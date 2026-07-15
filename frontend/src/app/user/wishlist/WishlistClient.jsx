"use client";

import { useEffect, useState } from "react";
import API_URL from "@/config/api";
import { apiRequest, wishlistApi, cartApi } from "@/lib/apiHelper";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WishlistClient() {
  const router = useRouter();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      setLoading(true);

      const res = await apiRequest(wishlistApi.getWishlist, {
        method: "GET",
      });

      if (res.success) {
        setWishlist(Array.isArray(res.data?.data) ? res.data.data : []);
      } else {
        setWishlist([]);
      }
    } catch (err) {
      console.log("WISHLIST ERROR:", err);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeWishlist = async (courseId) => {
    const res = await apiRequest(wishlistApi.removeFromWishlist, {
      method: "POST",
      data: { courseId },
    });

    if (!res.success) {
      alert(res.message || "Failed to remove");
      return;
    }

    setWishlist((prev) =>
      prev.filter((item) => Number(item.courseId) !== Number(courseId)),
    );

    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const moveToCart = async (courseId) => {
    const res = await apiRequest(cartApi.addToCart, {
      method: "POST",
      data: { courseId },
    });

    if (!res.success) {
      alert(res.message || "Failed to add to cart");
      return;
    }

    await removeWishlist(courseId);
    window.dispatchEvent(new Event("cartUpdated"));

    alert("Moved to cart");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-lg font-bold text-purple-700">
        Loading wishlist...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 px-5 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-xl">
          <span className="rounded-full bg-red-100 px-4 py-1 text-sm font-bold text-red-700">
            My Wishlist
          </span>

          <h1 className="mt-3 text-4xl font-black text-gray-900">
            Saved Courses
          </h1>

          <p className="mt-2 text-gray-500">
            Courses you saved for later purchase.
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-xl">
            <Heart className="mx-auto h-14 w-14 text-red-400" />

            <h2 className="mt-4 text-2xl font-black text-gray-900">
              Wishlist is empty
            </h2>

            <p className="mt-2 text-gray-500">
              Save courses you want to purchase later.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((course) => (
              <div
                key={course.wishlistId}
                className="overflow-hidden rounded-3xl bg-white shadow-xl"
              >
                <img
                  src={
                    course.courseImg
                      ? `${API_URL}/uploads/${course.courseImg}`
                      : `${API_URL}/uploads/default-course.png`
                  }
                  alt={course.courseName}
                  className="h-48 w-full object-cover"
                />

                <div className="p-5">
                  <h2 className="line-clamp-1 text-xl font-black text-gray-900">
                    {course.courseName}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                    {course.courseDesc}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    {Number(course.courseType) === 1 ? (
                      <h3 className="text-2xl font-black text-purple-700">
                        ₹{course.coursePrice}
                      </h3>
                    ) : (
                      <span className="font-bold text-green-700">
                        Free Access
                      </span>
                    )}

                    <span className="text-sm font-bold text-gray-500">
                      {course.chapterCount || 0} Chapters
                    </span>
                  </div>

                  <div className="mt-5 flex gap-3">
                    {Number(course.isPurchased) === 1 ? (
                      <button
                        onClick={() =>
                          router.push(
                            `/user/chapters/${course.courseSlug}`,
                          )
                        }
                        className="flex flex-1 items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700"
                      >
                        Continue Learning
                      </button>
                    ) : Number(course.courseType) === 1 ? (
                      <button
                        onClick={() => moveToCart(course.courseId)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-3 text-sm font-bold text-white hover:bg-purple-800"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Move to Cart
                      </button>
                    ) : null}

                    <button
                      onClick={() => removeWishlist(course.courseId)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
