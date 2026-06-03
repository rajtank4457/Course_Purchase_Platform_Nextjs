"use client";

import { useRouter } from "next/navigation";
import axios from "axios";
import API_URL from "@/config/api";
import { ShoppingCart } from "lucide-react";

export default function CourseActionButton({ course, isInCart, isInLibrary }) {
    const router = useRouter();

    const addToLibrary = async () => {
        try {
            await axios.post(
                `${API_URL}/library/add`,
                { courseId: course.courseId },
                { withCredentials: true }
            );

            window.dispatchEvent(new Event("libraryUpdated"));

            router.refresh();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add course to library");
        }
    };

    const addToCart = async () => {
        try {
            await axios.post(
                `${API_URL}/cart/add`,
                { courseId: course.courseId },
                { withCredentials: true }
            );

            window.dispatchEvent(new Event("cartUpdated"));

            router.refresh();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add course to cart");
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
                        addToCart();
                    }
                }}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition ${isInCart
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
            onClick={addToLibrary}
            className="rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
        >
            Add To Library
        </button>
    );
}