import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import Image from "next/image";

const ProfileFeed = (props: {userId: string}) => {

  const { data, isLoading } = api.posts.getPostsByUserId.useQuery({userId: props.userId,});

  if(isLoading) {
    return <LoadingPage/>
  }

  if(!data || data.length === 0) {
    return <div>User has not posted</div>
  }

  return(
    <div className="flex flex-col">
      {data.map((fullPost) => <PostView {...fullPost} key={fullPost.post.id}/>)}
    </div>
  )

}

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>404</div>;
  }

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <Layout>
        <div className="h-36 border-b border-slate-400 bg-slate-600 relative">
          <Image
            width={128}
            height={128}
            src={data.profilePicture}
            alt={`${data.profilePicture ?? ""}'s profile picture`}
            className="-mb-[64px] ml-4 absolute left-0 bottom-0 rounded-full border-4 border-black"
          />
        </div>
        <div className="h-[64px]"></div>
        <div className="p-4 text-2xl font-bold">{`@${data.username ?? ''}`}</div>
        <div className="border-b border-slate-400 w-full"></div>
        <ProfileFeed userId={data.id}/>
      </Layout>
    </>
  );
};

import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import superjson from "superjson";
import Layout from "~/components/Layout";
import { LoadingPage } from "~/components/Loading";
import { PostView } from "~/components/PostView";

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson, // optional - adds superjson serialization
  });

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("Slug is not a string");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default ProfilePage;
