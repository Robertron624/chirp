import { type NextPage } from "next";
import { SignInButton, useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";

import { api } from "~/utils/api";
import Layout from "~/components/Layout";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { LoadingPage, LoadingSpinner } from "~/components/Loading";
import { useState } from "react";
import { PostView } from "~/components/PostView";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();

  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (error) => {
      const errorMessage = error.data?.zodError?.fieldErrors.content;

      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      }else {
        toast.error("Failed to post, try again later");
      }
    }
  });

  if (!user) return null;
  

  return (
    <div className="flex w-full gap-3">
      <Image
        className="h-14 w-14 rounded-full"
        src={user.profileImageUrl}
        alt="user profile pic"
        width={56}
        height={56}
      />
      <input
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input != "") {
              mutate({ content: input });
            }
          }
        }}
        type="text"
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPosting}
      />
      { input != "" && !isPosting && (<button onClick={() => mutate({ content: input })}>Post</button>)}
      { isPosting && ( <div className="flex justify-center items-center"><LoadingSpinner size={20}/> </div>)}
    </div>
  );
};



const Feed = () => {
  const { data, isLoading: postLoading } = api.posts.getAll.useQuery();

  if (postLoading) return <LoadingPage />;
  if(!data) return <div>Something went wrong</div>

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView key={fullPost.post.id} {...fullPost} />
      ))}
    </div>
  );
}

const Home: NextPage = () => {

  // start fetching ASAP
  api.posts.getAll.useQuery();

  const {isLoaded: userLoaded, isSignedIn} = useUser();

  // Return empty div if user is not loaded yet
  if(!userLoaded ) return <div/>

  return (
    <>
      <Layout >
          <div className="border-b border-slate-400 p-4">
              {!isSignedIn && (
                <div className="flex justify-center">
                  <SignInButton />
                </div>
              )}
              {isSignedIn && <CreatePostWizard />}
          </div>
        <Feed />
      </Layout>  
    </>
  );
};

export default Home;
